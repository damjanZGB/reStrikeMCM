# Transparent Background & Disable-Backdrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add true-alpha transparent display output (so OBS Window Capture / vMix DesktopCapture2 preserve transparency including PNG alpha) plus an option to fully disable the backdrop, with a global default and per-ceremony tri-state override.

**Architecture:** Two boolean configs in `AppConfig` (`transparentBackground`, `backdropEnabled`) and two optional tri-state overrides in `CeremonyDisplayOptions`. The global `transparentBackground` arms the Electron BrowserWindow's `transparent: true` flag at creation time (can't change at runtime — flipping it auto-restarts the window). Per-ceremony overrides toggle CSS classes that strip solid backgrounds, letting the alpha pipeline pass through. When transparent + no secondary monitor, operator UI exposes Move/AOT/Close controls (no chrome on the display window).

**Tech Stack:** Electron 28, electron-vite, React 18 (TS), Zod, Vitest, Playwright (for Electron). pnpm workspace with `packages/shared`, `packages/core`, `apps/operator`, `apps/display`, `electron/`.

**Spec:** `docs/superpowers/specs/2026-05-12-transparent-background-design.md`

---

## Task 1: Extend shared types (TS interfaces)

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Add fields to `CeremonyDisplayOptions` and `AppConfig`**

In `packages/shared/src/types.ts`, update `CeremonyDisplayOptions` (lines 38-45) by adding two optional fields:

```ts
export interface CeremonyDisplayOptions {
  rankLabelStyle: RankLabelStyle
  riseCurve: RiseCurve
  namesMode: NamesMode
  goldTint: boolean
  textsEnabled: boolean
  backgroundOverride?: string | undefined
  transparentBackground?: boolean | undefined
  backdropEnabled?: boolean | undefined
}
```

In the same file, update `AppConfig` (lines 80-99) by adding two boolean fields just above `audio`:

```ts
export interface AppConfig {
  // ...all existing fields up to and including `defaults`...
  defaults: {
    riseCurve: RiseCurve
    namesMode: NamesMode
    goldTint: boolean
    rankLabelStyle: RankLabelStyle
  }
  transparentBackground: boolean
  backdropEnabled: boolean
  audio: { fadeOutMs: number }
  // ...rest unchanged...
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(shared): types — transparentBackground & backdropEnabled (AppConfig + per-ceremony override)"
```

---

## Task 2: Extend Zod schemas with defaults

**Files:**
- Modify: `packages/shared/src/schemas.ts`
- Test: `packages/shared/src/__tests__/schemas.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `packages/shared/src/__tests__/schemas.test.ts`:

```ts
describe('AppConfigSchema — transparency & backdrop', () => {
  it('defaults transparentBackground to false when missing', () => {
    const { transparentBackground: _omit, ...without } = SHIPPED_DEFAULT_CONFIG as AppConfig & { transparentBackground?: boolean }
    const parsed = AppConfigSchema.parse(without)
    expect(parsed.transparentBackground).toBe(false)
  })

  it('defaults backdropEnabled to true when missing', () => {
    const { backdropEnabled: _omit, ...without } = SHIPPED_DEFAULT_CONFIG as AppConfig & { backdropEnabled?: boolean }
    const parsed = AppConfigSchema.parse(without)
    expect(parsed.backdropEnabled).toBe(true)
  })

  it('accepts explicit transparentBackground=true', () => {
    const cfg = { ...SHIPPED_DEFAULT_CONFIG, transparentBackground: true }
    expect(() => AppConfigSchema.parse(cfg)).not.toThrow()
  })
})

describe('CeremonyDisplayOptionsSchema — per-ceremony overrides', () => {
  it('accepts undefined for both override fields', () => {
    const d = { rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card', goldTint: false, textsEnabled: true }
    expect(() => CeremonyDisplayOptionsSchema.parse(d)).not.toThrow()
  })

  it('accepts true/false for transparentBackground and backdropEnabled', () => {
    const base = { rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card', goldTint: false, textsEnabled: true }
    expect(() => CeremonyDisplayOptionsSchema.parse({ ...base, transparentBackground: true,  backdropEnabled: false })).not.toThrow()
    expect(() => CeremonyDisplayOptionsSchema.parse({ ...base, transparentBackground: false, backdropEnabled: true  })).not.toThrow()
  })
})
```

Also add to the imports at the top of the file:

```ts
import { AppConfigSchema, CeremonySchema, AthleteSchema, CeremonyDisplayOptionsSchema } from '../schemas.js'
import type { AppConfig } from '../types.js'
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @restrike-mcm/shared test
```

Expected: New tests FAIL — `transparentBackground` and `backdropEnabled` are not in the schema yet; `CeremonyDisplayOptionsSchema` doesn't have the optional fields.

- [ ] **Step 3: Update `CeremonyDisplayOptionsSchema`**

In `packages/shared/src/schemas.ts`, change `CeremonyDisplayOptionsSchema` (lines 39-46) to:

```ts
export const CeremonyDisplayOptionsSchema = z.object({
  rankLabelStyle: RankLabelStyleSchema,
  riseCurve: RiseCurveSchema,
  namesMode: NamesModeSchema,
  goldTint: z.boolean(),
  textsEnabled: z.boolean().default(true),
  backgroundOverride: z.string().optional(),
  transparentBackground: z.boolean().optional(),
  backdropEnabled: z.boolean().optional(),
})
```

- [ ] **Step 4: Update `AppConfigSchema`**

In `packages/shared/src/schemas.ts`, change `AppConfigSchema` (lines 71-98) so that immediately after the `defaults` block and before `audio` it has:

```ts
  defaults: z.object({
    riseCurve: RiseCurveSchema,
    namesMode: NamesModeSchema,
    goldTint: z.boolean(),
    rankLabelStyle: RankLabelStyleSchema,
  }),
  transparentBackground: z.boolean().default(false),
  backdropEnabled: z.boolean().default(true),
  audio: z.object({ fadeOutMs: z.number().min(0).max(5000) }),
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @restrike-mcm/shared test
```

Expected: all schema tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas.ts packages/shared/src/__tests__/schemas.test.ts
git commit -m "feat(shared): zod — transparentBackground/backdropEnabled with defaults"
```

---

## Task 3: Update SHIPPED_DEFAULT_CONFIG constant

**Files:**
- Modify: `packages/shared/src/constants.ts`

- [ ] **Step 1: Add the two new keys to `SHIPPED_DEFAULT_CONFIG`**

In `packages/shared/src/constants.ts`, change `SHIPPED_DEFAULT_CONFIG` (lines 22-43) to include the two new keys after `defaults`:

```ts
export const SHIPPED_DEFAULT_CONFIG: AppConfig = {
  version: 1,
  disciplines: ['Kyorugi', 'Poomsae', 'Para-TKD K44', 'Para-TKD P44', 'Freestyle Poomsae', 'Pair Poomsae', 'Team Poomsae', 'Breaking'],
  ageCategories: ['Cadet', 'Junior', 'Senior', 'Master M30+', 'Master M40+', 'Master M50+', 'Youth'],
  genders: ['Men', 'Women', 'Mixed'],
  rankLabels: {
    position: ['1ST', '2ND', '3RD', '3RD'],
    medal:    ['GOLD', 'SILVER', 'BRONZE', 'BRONZE'],
  },
  title: DEFAULT_TITLE,
  defaultBackground: 'default-backdrop.jpg',
  defaults: {
    riseCurve: 'rise-hold',
    namesMode: 'title-card',
    goldTint: false,
    rankLabelStyle: 'position',
  },
  transparentBackground: false,
  backdropEnabled: true,
  audio: { fadeOutMs: DEFAULT_FADE_OUT_MS },
  podium: { goldHeightPct: 88, silverHeightPct: 78, bronzeHeightPct: 68 },
  flagHoldMs: 5000,
  playShortcut: 'Control+Alt+P',
}
```

- [ ] **Step 2: Run schema tests to verify SHIPPED_DEFAULT_CONFIG still parses**

```bash
pnpm --filter @restrike-mcm/shared test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/constants.ts
git commit -m "feat(shared): constants — defaults for transparentBackground/backdropEnabled"
```

---

## Task 4: Update default-config.json

**Files:**
- Modify: `default-config.json`

- [ ] **Step 1: Add the two new keys to default-config.json**

Replace `default-config.json` with:

```json
{
  "version": 1,
  "disciplines": ["Kyorugi", "Poomsae", "Para-TKD K44", "Para-TKD P44", "Freestyle Poomsae", "Pair Poomsae", "Team Poomsae", "Breaking"],
  "ageCategories": ["Cadet", "Junior", "Senior", "Master M30+", "Master M40+", "Master M50+", "Youth"],
  "genders": ["Men", "Women", "Mixed"],
  "rankLabels": {
    "position": ["1ST", "2ND", "3RD", "3RD"],
    "medal":    ["GOLD", "SILVER", "BRONZE", "BRONZE"]
  },
  "title": {
    "text": "MEDAL CEREMONY",
    "fontFamily": "system-ui, -apple-system, sans-serif",
    "fontSize": 2.5,
    "fontWeight": 700,
    "letterSpacing": 0,
    "color": "#ffd700",
    "textShadow": "0 2px 8px rgba(0, 0, 0, 0.8)",
    "animation": "fade-in",
    "textAlign": "center",
    "verticalAlign": "top",
    "x": 50,
    "y": 14
  },
  "defaultBackground": "default-backdrop.jpg",
  "defaults": {
    "riseCurve": "rise-hold",
    "namesMode": "title-card",
    "goldTint": false,
    "rankLabelStyle": "position"
  },
  "transparentBackground": false,
  "backdropEnabled": true,
  "audio": { "fadeOutMs": 1500 },
  "podium": { "goldHeightPct": 88, "silverHeightPct": 78, "bronzeHeightPct": 68 },
  "flagHoldMs": 5000,
  "playShortcut": "Control+Alt+P"
}
```

- [ ] **Step 2: Commit**

```bash
git add default-config.json
git commit -m "feat(MCM): default-config.json — transparentBackground/backdropEnabled keys"
```

---

## Task 5: Config-store round-trip preserves new fields

**Files:**
- Test: `packages/core/src/__tests__/config-store.test.ts`

- [ ] **Step 1: Add a round-trip test**

Append to `packages/core/src/__tests__/config-store.test.ts`:

```ts
describe('round-trip of new transparency/backdrop fields', () => {
  it('persists explicit values to disk and loads them back', async () => {
    const configPath = join(dir, 'config.json')
    const cfg = { ...SHIPPED_DEFAULT_CONFIG, transparentBackground: true, backdropEnabled: false }
    await saveConfig(configPath, cfg)
    const loaded = await loadConfig(configPath, '/nonexistent')
    expect(loaded.transparentBackground).toBe(true)
    expect(loaded.backdropEnabled).toBe(false)
  })

  it('fills defaults when loading a legacy config missing both fields', async () => {
    const configPath = join(dir, 'config.json')
    const { transparentBackground: _t, backdropEnabled: _b, ...legacy } = SHIPPED_DEFAULT_CONFIG
    await writeFile(configPath, JSON.stringify(legacy))
    const loaded = await loadConfig(configPath, '/nonexistent')
    expect(loaded.transparentBackground).toBe(false)
    expect(loaded.backdropEnabled).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test**

```bash
pnpm --filter @restrike-mcm/core test
```

Expected: tests PASS (Zod defaults handle the legacy case, save/load preserves explicit values).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/__tests__/config-store.test.ts
git commit -m "test(core): config-store round-trips transparency/backdrop fields"
```

---

## Task 6: Pure resolution function

**Files:**
- Create: `apps/display/src/lib/resolve-display-mode.ts`
- Test: `apps/display/src/lib/__tests__/resolve-display-mode.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/display/src/lib/__tests__/resolve-display-mode.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { CeremonyDisplayOptions } from '@restrike-mcm/shared'
import { resolveDisplayMode } from '../resolve-display-mode.js'

const base: CeremonyDisplayOptions = {
  rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card',
  goldTint: false, textsEnabled: true,
}

describe('resolveDisplayMode', () => {
  it('inherits global when both per-ceremony fields are undefined', () => {
    const got = resolveDisplayMode(base, { transparentBackground: true, backdropEnabled: false })
    expect(got).toEqual({ transparent: true, backdropOn: false })
  })

  it('per-ceremony transparent override wins over global', () => {
    const got = resolveDisplayMode({ ...base, transparentBackground: false }, { transparentBackground: true, backdropEnabled: true })
    expect(got.transparent).toBe(false)
  })

  it('per-ceremony backdrop override wins over global', () => {
    const got = resolveDisplayMode({ ...base, backdropEnabled: true }, { transparentBackground: false, backdropEnabled: false })
    expect(got.backdropOn).toBe(true)
  })

  it('returns sensible defaults when no ceremony is active', () => {
    const got = resolveDisplayMode(null, { transparentBackground: false, backdropEnabled: true })
    expect(got).toEqual({ transparent: false, backdropOn: true })
  })

  it('full truth table coverage — overrides false', () => {
    const got = resolveDisplayMode(
      { ...base, transparentBackground: false, backdropEnabled: false },
      { transparentBackground: true, backdropEnabled: true },
    )
    expect(got).toEqual({ transparent: false, backdropOn: false })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @restrike-mcm/display test || true
```

Note: if the display app doesn't yet have a `test` script in its `package.json`, fall back to running `vitest` from repo root: `pnpm exec vitest run apps/display/src/lib/__tests__/resolve-display-mode.test.ts`.

Expected: tests FAIL — module not found.

- [ ] **Step 3: Implement the pure function**

Create `apps/display/src/lib/resolve-display-mode.ts`:

```ts
import type { CeremonyDisplayOptions } from '@restrike-mcm/shared'

export interface DisplayModeGlobal {
  transparentBackground: boolean
  backdropEnabled: boolean
}

export interface DisplayMode {
  transparent: boolean
  backdropOn: boolean
}

/**
 * Resolve the effective display mode for the current frame.
 * Per-ceremony override (when defined) wins over the global default.
 * When no ceremony is active, the global default applies.
 */
export function resolveDisplayMode(
  display: CeremonyDisplayOptions | null,
  global: DisplayModeGlobal,
): DisplayMode {
  return {
    transparent: display?.transparentBackground ?? global.transparentBackground,
    backdropOn:  display?.backdropEnabled       ?? global.backdropEnabled,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm exec vitest run apps/display/src/lib/__tests__/resolve-display-mode.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/display/src/lib/resolve-display-mode.ts apps/display/src/lib/__tests__/resolve-display-mode.test.ts
git commit -m "feat(display): pure resolver for transparency + backdrop mode"
```

---

## Task 7: Window lifecycle — accept `transparent` option

**Files:**
- Modify: `electron/windows.ts`

- [ ] **Step 1: Change `createDisplayWindow` signature and constructor params**

Replace `createDisplayWindow` and add a helper to set/clear always-on-top, in `electron/windows.ts`. The whole function becomes:

```ts
export function createDisplayWindow(opts: { transparent: boolean } = { transparent: false }): BrowserWindow {
  if (displayWin && !displayWin.isDestroyed()) {
    return displayWin
  }
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const secondary = displays.find(d => d.id !== primary.id)
  const target = secondary ?? primary
  const isSecondary = !!secondary
  const transparent = opts.transparent

  // Transparent windows on Windows can't reliably use fullscreen + DWM compositing.
  // Use a frameless borderless window sized to the display bounds instead.
  const fullscreen = !transparent && isSecondary
  const frame = !transparent && !isSecondary
  const width  = (transparent || isSecondary) ? target.bounds.width  : 1280
  const height = (transparent || isSecondary) ? target.bounds.height : 720

  displayWin = new BrowserWindow({
    x: target.bounds.x, y: target.bounds.y,
    width, height,
    fullscreen,
    frame,
    transparent,
    hasShadow: !transparent,
    backgroundColor: transparent ? '#00000000' : '#000000',
    autoHideMenuBar: true,
    title: 'reStrike MCM · Display',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      autoplayPolicy: 'no-user-gesture-required' as const,
    },
  })

  if (transparent && !isSecondary) {
    // Borderless + primary monitor: stay on top so OBS can find it and the user
    // can see it. Operator UI can toggle this off via 'display:set-always-on-top'.
    displayWin.setAlwaysOnTop(true, 'screen-saver')
  }

  displayWin.on('closed', () => { displayWin = null })
  displayWin.webContents.openDevTools({ mode: 'detach' })  // TEMP debug
  return displayWin
}
```

- [ ] **Step 2: Verify the file still compiles**

```bash
pnpm typecheck
```

Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add electron/windows.ts
git commit -m "feat(electron): createDisplayWindow accepts transparent option"
```

---

## Task 8: IPC channels for display — get-transparent-mode, move mode, always-on-top, monitor config

**Files:**
- Modify: `electron/ipc/display-channels.ts`

- [ ] **Step 1: Replace `electron/ipc/display-channels.ts` with the extended version**

Replace the full content of `electron/ipc/display-channels.ts` with:

```ts
import { ipcMain, screen } from 'electron'
import { join } from 'node:path'
import { loadConfig } from '@restrike-mcm/core'
import { createDisplayWindow, closeDisplayWindow, loadDisplayContent, getDisplayWindow, getOperatorWindow } from '../windows.js'
import { ASSETS_ROOT, CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'

export function registerDisplayChannels() {
  ipcMain.handle('display:push', async () => {
    const existing = getDisplayWindow()
    if (existing) {
      existing.focus()
      return { ok: true, reason: 'Display 2 already active' }
    }
    const cfg = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    const win = createDisplayWindow({ transparent: cfg.transparentBackground })
    win.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[main] display did-fail-load ${code} ${desc} ${url}`)
    })
    await loadDisplayContent(win)
    const hasSecondary = screen.getAllDisplays().length > 1
    return hasSecondary
      ? { ok: true }
      : { ok: true, reason: 'Only one display detected — running on primary' }
  })

  ipcMain.handle('display:reset', () => {
    closeDisplayWindow()
  })

  ipcMain.handle('display:resolve-default-backdrop', async () => {
    const config = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    return config.defaultBackgroundCustomPath
      ?? join(ASSETS_ROOT, 'backgrounds', config.defaultBackground)
  })

  ipcMain.handle('display:get-mode', async () => {
    const config = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    return {
      transparentBackground: config.transparentBackground,
      backdropEnabled: config.backdropEnabled,
    }
  })

  ipcMain.handle('display:set-move-mode', (_e, enabled: boolean) => {
    const win = getDisplayWindow()
    if (!win) return
    // While moving, drop always-on-top so the user can see other windows;
    // re-pin it when leaving move mode (no secondary path — see windows.ts).
    win.setAlwaysOnTop(!enabled, 'screen-saver')
    win.webContents.send('display:move-mode-changed', enabled)
  })

  ipcMain.handle('display:set-always-on-top', (_e, enabled: boolean) => {
    const win = getDisplayWindow()
    if (!win) return
    win.setAlwaysOnTop(enabled, 'screen-saver')
  })

  ipcMain.handle('display:has-secondary', () => {
    return screen.getAllDisplays().length > 1
  })

  // Push monitor-config changes to operator so its UI can hide/show
  // the transparent-window controls when a secondary is plugged/unplugged.
  const broadcastMonitorConfig = () => {
    const hasSecondary = screen.getAllDisplays().length > 1
    getOperatorWindow()?.webContents.send('display:monitor-config-changed', { hasSecondary })
  }
  screen.on('display-added', broadcastMonitorConfig)
  screen.on('display-removed', broadcastMonitorConfig)
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add electron/ipc/display-channels.ts
git commit -m "feat(electron/ipc): display channels for transparency mode + move/AOT + monitor-config events"
```

---

## Task 9: Config-channels post-set hook — restart display on transparency flip

**Files:**
- Modify: `electron/ipc/config-channels.ts`

- [ ] **Step 1: Add display-restart logic after save**

Replace the full content of `electron/ipc/config-channels.ts` with:

```ts
import { ipcMain } from 'electron'
import { loadConfig, saveConfig } from '@restrike-mcm/core'
import { AppConfigSchema, type AppConfig } from '@restrike-mcm/shared'
import { CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'
import { setPlayShortcut } from '../shortcut-manager.js'
import { getDisplayWindow, closeDisplayWindow, createDisplayWindow, loadDisplayContent, getOperatorWindow } from '../windows.js'

let cached: AppConfig | null = null

export function registerConfigChannels() {
  ipcMain.handle('config:get', async () => {
    if (cached) return cached
    cached = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    return cached
  })

  ipcMain.handle('config:set', async (_e, partial: Partial<AppConfig>) => {
    const current = cached ?? await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    const next = AppConfigSchema.parse({ ...current, ...partial })
    await saveConfig(CONFIG_PATH, next)
    cached = next

    if (partial.playShortcut !== undefined && partial.playShortcut !== current.playShortcut) {
      setPlayShortcut(next.playShortcut)
    }

    // Electron's transparent flag can't change post-creation, so a flip
    // requires closing and re-opening the display window. Notify the operator.
    if (partial.transparentBackground !== undefined
        && partial.transparentBackground !== current.transparentBackground
        && getDisplayWindow()) {
      closeDisplayWindow()
      const win = createDisplayWindow({ transparent: next.transparentBackground })
      win.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.error(`[main] display did-fail-load ${code} ${desc} ${url}`)
      })
      await loadDisplayContent(win)
      getOperatorWindow()?.webContents.send('display:restarted-for-transparency', {
        transparentBackground: next.transparentBackground,
      })
    }

    return next
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add electron/ipc/config-channels.ts
git commit -m "feat(electron/ipc): restart display window when transparentBackground toggles"
```

---

## Task 10: Expose new channels in preload

**Files:**
- Modify: `electron/preload.ts`

- [ ] **Step 1: Add new wrappers to the api object**

Replace the `display` block in `electron/preload.ts` (lines 24-33) with:

```ts
  display: {
    push: () => ipcRenderer.invoke('display:push'),
    reset: () => ipcRenderer.invoke('display:reset'),
    resolveDefaultBackdrop: () => ipcRenderer.invoke('display:resolve-default-backdrop'),
    getMode: () => ipcRenderer.invoke('display:get-mode'),
    setMoveMode: (enabled: boolean) => ipcRenderer.invoke('display:set-move-mode', enabled),
    setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('display:set-always-on-top', enabled),
    hasSecondary: () => ipcRenderer.invoke('display:has-secondary'),
    onLost: (cb: () => void) => {
      const listener = () => cb()
      ipcRenderer.on('display:lost', listener)
      return () => ipcRenderer.removeListener('display:lost', listener)
    },
    onMoveModeChanged: (cb: (enabled: boolean) => void) => {
      const listener = (_: any, enabled: boolean) => cb(enabled)
      ipcRenderer.on('display:move-mode-changed', listener)
      return () => ipcRenderer.removeListener('display:move-mode-changed', listener)
    },
    onMonitorConfigChanged: (cb: (info: { hasSecondary: boolean }) => void) => {
      const listener = (_: any, info: { hasSecondary: boolean }) => cb(info)
      ipcRenderer.on('display:monitor-config-changed', listener)
      return () => ipcRenderer.removeListener('display:monitor-config-changed', listener)
    },
    onRestartedForTransparency: (cb: (info: { transparentBackground: boolean }) => void) => {
      const listener = (_: any, info: { transparentBackground: boolean }) => cb(info)
      ipcRenderer.on('display:restarted-for-transparency', listener)
      return () => ipcRenderer.removeListener('display:restarted-for-transparency', listener)
    },
  },
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add electron/preload.ts
git commit -m "feat(electron/preload): expose display.getMode/setMoveMode/setAlwaysOnTop/events"
```

---

## Task 11: Operator IPC-bridge typed wrappers

**Files:**
- Modify: `apps/operator/src/ipc-bridge.ts`

- [ ] **Step 1: Extend the `display` block of `OperatorApi`**

Replace the `display` block in `apps/operator/src/ipc-bridge.ts` (lines 19-23) with:

```ts
  display: {
    push(): Promise<{ ok: boolean; reason?: string }>
    reset(): Promise<void>
    getMode(): Promise<{ transparentBackground: boolean; backdropEnabled: boolean }>
    setMoveMode(enabled: boolean): Promise<void>
    setAlwaysOnTop(enabled: boolean): Promise<void>
    hasSecondary(): Promise<boolean>
    onLost(cb: () => void): () => void
    onMonitorConfigChanged(cb: (info: { hasSecondary: boolean }) => void): () => void
    onRestartedForTransparency(cb: (info: { transparentBackground: boolean }) => void): () => void
  }
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/operator/src/ipc-bridge.ts
git commit -m "feat(operator/ipc): typed wrappers for display mode + move/AOT + events"
```

---

## Task 12: Display IPC-bridge typed wrappers

**Files:**
- Modify: `apps/display/src/ipc-bridge.ts`

- [ ] **Step 1: Add `getMode` and `onMoveModeChanged` to `DisplayApi`**

Replace the `display` block in `apps/display/src/ipc-bridge.ts` (lines 7-9) with:

```ts
  display: {
    resolveDefaultBackdrop(): Promise<string>
    getMode(): Promise<{ transparentBackground: boolean; backdropEnabled: boolean }>
    onMoveModeChanged(cb: (enabled: boolean) => void): () => void
  }
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/display/src/ipc-bridge.ts
git commit -m "feat(display/ipc): typed wrappers for getMode + move-mode event"
```

---

## Task 13: Renderer CSS — transparent class + move-handle styles

**Files:**
- Modify: `apps/display/src/styles.css`

- [ ] **Step 1: Append the new rules**

Append to `apps/display/src/styles.css`:

```css
/* Transparent output: when the display window has `transparent: true`, every
   solid background up the tree has to be cleared so the alpha channel can pass
   through to OBS/vMix Window Capture. Toggled by App.tsx on the html/body/#root
   and .display-root nodes based on the resolved display mode. */
html.transparent, body.transparent, #root.transparent { background: transparent; }
.display-root.transparent,
.display-root.transparent .backdrop {
  background: transparent;
  background-color: transparent;
}

/* Move-mode handles — only rendered when the operator clicks Move/resize on a
   transparent display window without a secondary monitor (otherwise the window
   is frameless and there's no way to drag/resize it). 8px translucent strip
   along the top and a 16x16 corner handle bottom-right, both `app-region: drag`. */
.move-handle-top {
  position: fixed; top: 0; left: 0; right: 0; height: 8px;
  background: rgba(255, 255, 255, 0.18);
  -webkit-app-region: drag;
  z-index: 9999;
  pointer-events: auto;
}
.move-handle-corner {
  position: fixed; bottom: 0; right: 0; width: 16px; height: 16px;
  background: rgba(255, 255, 255, 0.18);
  -webkit-app-region: drag;
  z-index: 9999;
  pointer-events: auto;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/display/src/styles.css
git commit -m "feat(display/css): .transparent class + move-handle styles"
```

---

## Task 14: App.tsx — resolve mode, toggle classes, render move handles

**Files:**
- Modify: `apps/display/src/App.tsx`

- [ ] **Step 1: Replace `App.tsx` with the new implementation**

Replace the full content of `apps/display/src/App.tsx` with:

```tsx
import React, { useEffect, useState } from 'react'
import type { PlayoutInstruction } from '@restrike-mcm/shared'
import { PlayoutEngine } from './PlayoutEngine.js'
import { api } from './ipc-bridge.js'
import { resolveDisplayMode } from './lib/resolve-display-mode.js'

export function App() {
  const [instruction, setInstruction] = useState<PlayoutInstruction | null>(null)
  const [defaultBackdropPath, setDefaultBackdropPath] = useState<string | null>(null)
  const [globalMode, setGlobalMode] = useState<{ transparentBackground: boolean; backdropEnabled: boolean }>({
    transparentBackground: false,
    backdropEnabled: true,
  })
  const [moveMode, setMoveMode] = useState(false)

  useEffect(() => {
    const offPlay = api.ceremony.onPlay(setInstruction)
    const offStop = api.ceremony.onStop(() => setInstruction(null))
    return () => { offPlay(); offStop() }
  }, [])

  useEffect(() => {
    api.display.resolveDefaultBackdrop()
      .then(p => {
        console.log('[display] default backdrop path:', p)
        setDefaultBackdropPath(p)
      })
      .catch(err => console.error('[display] default backdrop resolve failed', err))
  }, [])

  useEffect(() => {
    api.display.getMode().then(setGlobalMode).catch(err => console.error('[display] getMode failed', err))
  }, [])

  useEffect(() => {
    return api.display.onMoveModeChanged(setMoveMode)
  }, [])

  const mode = resolveDisplayMode(instruction?.ceremony.display ?? null, globalMode)

  // Toggle the `.transparent` class on html/body/#root so the CSS rules in
  // styles.css can strip solid backgrounds when transparent mode is on.
  useEffect(() => {
    const root = document.getElementById('root')
    document.documentElement.classList.toggle('transparent', mode.transparent)
    document.body.classList.toggle('transparent', mode.transparent)
    root?.classList.toggle('transparent', mode.transparent)
  }, [mode.transparent])

  return (
    <>
      <PlayoutEngine
        instruction={instruction}
        defaultBackdropPath={defaultBackdropPath}
        transparent={mode.transparent}
        backdropOn={mode.backdropOn}
      />
      {moveMode && (
        <>
          <div className="move-handle-top" />
          <div className="move-handle-corner" />
        </>
      )}
    </>
  )
}
```

- [ ] **Step 2: Typecheck (will fail until Task 15 lands; that's expected)**

```bash
pnpm typecheck
```

Expected: TypeScript will complain that `PlayoutEngine` doesn't accept `transparent`/`backdropOn` props yet. That's fine — fixed in the next task.

- [ ] **Step 3: Commit**

```bash
git add apps/display/src/App.tsx
git commit -m "feat(display): App resolves global+per-ceremony mode and renders move handles"
```

---

## Task 15: PlayoutEngine — accept new props, gate backdrop on backdropOn, pass transparent class

**Files:**
- Modify: `apps/display/src/PlayoutEngine.tsx`

- [ ] **Step 1: Update `Props` interface and root JSX**

In `apps/display/src/PlayoutEngine.tsx`, replace the `Props` interface (lines 42-45) with:

```ts
interface Props {
  instruction: PlayoutInstruction | null
  defaultBackdropPath?: string | null | undefined
  transparent: boolean
  backdropOn: boolean
}
```

Replace the function signature line (line 52) and the backdrop-resolution block (lines 130-144), plus the `<div className="display-root">` opening tag in the rendered JSX, so that backdrops are gated and the class is applied. The relevant changes:

Replace line 52:
```ts
export function PlayoutEngine({ instruction, defaultBackdropPath, transparent, backdropOn }: Props) {
```

Replace the block `const backdropPath = instruction?.resolvedAssets.backgroundPath ?? defaultBackdropPath` ... `if (!instruction) { return ( ... ) }` (around lines 130-144) with:

```tsx
  // Backdrop resolution. When `backdropOn` is false, we skip the entire <div>
  // (no image rendered, no fetch). This is what gives the "fully transparent
  // output" mode when combined with transparent === true.
  const backdropPath = backdropOn
    ? (instruction?.resolvedAssets.backgroundPath ?? defaultBackdropPath)
    : null
  const backdropStyle = backdropPath
    ? { backgroundImage: `url("${toFileUrl(backdropPath)}")` }
    : undefined

  const rootClass = `display-root${transparent ? ' transparent' : ''}`

  if (!instruction) {
    return (
      <div className={rootClass}>
        {backdropPath && <div className="backdrop" style={backdropStyle} />}
      </div>
    )
  }
```

Also change the in-ceremony return (line 162) from `<div className="display-root">` to `<div className={rootClass}>`.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS now.

- [ ] **Step 3: Commit**

```bash
git add apps/display/src/PlayoutEngine.tsx
git commit -m "feat(display): PlayoutEngine gates backdrop on backdropOn + propagates transparent class"
```

---

## Task 16: DisplayOptionsPanel — tri-state selects for per-ceremony override

**Files:**
- Modify: `apps/operator/src/components/DisplayOptionsPanel.tsx`

- [ ] **Step 1: Add a tri-state helper and two new selects**

In `apps/operator/src/components/DisplayOptionsPanel.tsx`, add this helper above the component (after the `toFileUrl` function, around line 17):

```ts
type TriState = 'inherit' | 'true' | 'false'
const toTri = (v: boolean | undefined): TriState => v === undefined ? 'inherit' : v ? 'true' : 'false'
const fromTri = (v: TriState): boolean | undefined => v === 'inherit' ? undefined : v === 'true'
```

Then inside the component's JSX, between the "Disable all texts and titles" toggle row (around line 81) and the existing `<h4>Background</h4>` heading (line 83), insert:

```tsx
      <label>Transparency
        <select
          value={toTri(display.transparentBackground)}
          onChange={e => set('transparentBackground', fromTri(e.target.value as TriState))}
        >
          <option value="inherit">Use global default</option>
          <option value="true">Transparent</option>
          <option value="false">Opaque</option>
        </select>
      </label>

      <label>Backdrop
        <select
          value={toTri(display.backdropEnabled)}
          onChange={e => set('backdropEnabled', fromTri(e.target.value as TriState))}
        >
          <option value="inherit">Use global default</option>
          <option value="true">Show backdrop</option>
          <option value="false">Hide backdrop</option>
        </select>
      </label>
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/operator/src/components/DisplayOptionsPanel.tsx
git commit -m "feat(operator): per-ceremony tri-state selects for transparency + backdrop"
```

---

## Task 17: SettingsDialog — global Display output section

**Files:**
- Modify: `apps/operator/src/pages/SettingsDialog.tsx`

- [ ] **Step 1: Insert the new section above "Default backdrop image"**

In `apps/operator/src/pages/SettingsDialog.tsx`, locate the section `<h5>Default backdrop image</h5>` (around line 198) and insert this new settings-section block immediately before its enclosing `<div className="settings-section">`:

```tsx
          <div className="settings-section">
            <h5>Display output</h5>
            <label className="toggle-row">Transparent background output (for OBS/vMix capture)
              <input
                type="checkbox"
                checked={config.transparentBackground}
                onChange={e => set('transparentBackground', e.target.checked)}
              />
            </label>
            <div className="settings-hint">
              Opens the display window with an alpha channel. The display window restarts when this changes.
            </div>
            <label className="toggle-row" style={{ marginTop: 8 }}>Show backdrop image
              <input
                type="checkbox"
                checked={config.backdropEnabled}
                onChange={e => set('backdropEnabled', e.target.checked)}
              />
            </label>
          </div>
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/operator/src/pages/SettingsDialog.tsx
git commit -m "feat(operator): Settings dialog — Display output section (transparency + backdrop)"
```

---

## Task 18: Session — display-window controls (Move / AOT / Close) for primary-only transparent

**Files:**
- Modify: `apps/operator/src/pages/Session.tsx`

- [ ] **Step 1: Add state, subscriptions, and the new control group**

In `apps/operator/src/pages/Session.tsx`, add to the top of the `Session` component body (after the existing `const [toasts, setToasts] = useState<Toast[]>([])` on line 46):

```tsx
  const [hasSecondary, setHasSecondary] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)
  const [moveMode, setMoveModeState] = useState(false)
  const [aot, setAot] = useState(true)
```

Then add these `useEffect`s immediately after the existing `api.display.onLost` effect (around line 60):

```tsx
  useEffect(() => {
    api.display.hasSecondary().then(setHasSecondary)
    return api.display.onMonitorConfigChanged(info => setHasSecondary(info.hasSecondary))
  }, [])

  useEffect(() => {
    return api.display.onRestartedForTransparency(() => {
      showToast('info', 'Display window restarted to apply transparency change.')
      // After restart the window is open with current AOT default (true).
      setDisplayOpen(true)
      setMoveModeState(false)
      setAot(true)
    })
  }, [])

  useEffect(() => {
    return api.display.onLost(() => setDisplayOpen(false))
  }, [])
```

Modify the existing "Push to Display 2" button to also set `displayOpen` on success. Change line 164 from:

```tsx
          <button className="btn-secondary" onClick={() => api.display.push()}>📺 Push to Display 2</button>
```

to:

```tsx
          <button className="btn-secondary" onClick={async () => {
            const r = await api.display.push()
            if (r.ok) setDisplayOpen(true)
          }}>📺 Push to Display 2</button>
          {displayOpen && config.transparentBackground && !hasSecondary && (
            <div className="display-controls">
              <button
                className={`btn-secondary${moveMode ? ' active' : ''}`}
                onClick={async () => {
                  const next = !moveMode
                  setMoveModeState(next)
                  await api.display.setMoveMode(next)
                }}
              >
                {moveMode ? '✓ Move/resize' : 'Move/resize'}
              </button>
              <button
                className={`btn-secondary${aot ? ' active' : ''}`}
                onClick={async () => {
                  const next = !aot
                  setAot(next)
                  await api.display.setAlwaysOnTop(next)
                }}
              >
                {aot ? '📌 Always on top' : 'Always on top'}
              </button>
              <button
                className="btn-secondary"
                onClick={async () => {
                  await api.display.reset()
                  setDisplayOpen(false)
                }}
              >
                ✕ Close display
              </button>
            </div>
          )}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/operator/src/pages/Session.tsx
git commit -m "feat(operator): Session — Move/AOT/Close controls for primary-only transparent display"
```

---

## Task 19: E2E test — schema-level smoke for transparent mode

**Files:**
- Create: `tests/e2e/transparent-mode.spec.ts`

- [ ] **Step 1: Add the test**

Create `tests/e2e/transparent-mode.spec.ts`:

```ts
import { test, expect, _electron as electron } from '@playwright/test'
import { resolve } from 'node:path'

test('toggling transparent background in settings closes and reopens the display window', async () => {
  const app = await electron.launch({
    args: [resolve(__dirname, '../../out/main/main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  })
  const operator = await app.firstWindow()
  await expect(operator.locator('strong')).toContainText('reStrike MCM')

  // Push to display 2 (single monitor in CI → windowed on primary).
  await operator.click('text=📺 Push to Display 2')

  // Wait until the display window registers.
  await app.waitForEvent('window', { timeout: 5000 })

  // Open Settings → flip transparent on → settings auto-saves on change.
  await operator.click('text=⚙ Settings')
  await operator.locator('text=Transparent background output').locator('..').locator('input[type=checkbox]').check()

  // The display window should have been closed and re-opened — assert the
  // operator received the toast.
  await expect(operator.locator('text=Display window restarted')).toBeVisible({ timeout: 5000 })

  await app.close()
})

test('display root DOM carries .transparent class after toggle', async () => {
  const app = await electron.launch({
    args: [resolve(__dirname, '../../out/main/main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  })
  const operator = await app.firstWindow()
  await operator.click('text=📺 Push to Display 2')
  const displayWin = await app.waitForEvent('window', { timeout: 5000 })

  // Default: no transparent class
  await expect(displayWin.locator('html.transparent')).toHaveCount(0)

  // Toggle on
  await operator.click('text=⚙ Settings')
  await operator.locator('text=Transparent background output').locator('..').locator('input[type=checkbox]').check()
  await operator.click('text=✕')  // close settings

  // After restart, the new display window should carry the .transparent class.
  const newDisplay = await app.waitForEvent('window', { timeout: 8000 })
  await expect(newDisplay.locator('html.transparent')).toHaveCount(1)

  await app.close()
})
```

- [ ] **Step 2: Build first (Playwright config launches the built main.js)**

```bash
pnpm build
```

Expected: PASS (Vite + electron-builder produce `out/main/main.js` and `out/renderer/...`).

- [ ] **Step 3: Run the new e2e test**

```bash
pnpm exec playwright test --config tests/e2e/playwright.config.ts transparent-mode.spec.ts
```

Expected: PASS. If the second test is flaky (multi-window ordering), keep just the first test as the strict assertion and document the second as "smoke" — both are acceptable for the PR.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/transparent-mode.spec.ts
git commit -m "test(e2e): transparent-mode toggle restarts display + applies .transparent class"
```

---

## Task 20: Runbook — OBS/vMix capture configuration

**Files:**
- Modify: `docs/runbook.md`

- [ ] **Step 1: Append a new section**

Append to `docs/runbook.md`:

```markdown

## Transparent display output (OBS / vMix capture)

The display window can be opened with an alpha channel so capture software preserves PNG transparency end-to-end.

**Enable in app:** Settings → Display output → check "Transparent background output". The display window restarts automatically. To remove the backdrop entirely (no image, no fallback), also uncheck "Show backdrop image".

Per-ceremony overrides are in each ceremony's Display options panel ("Transparency" and "Backdrop" selects).

### OBS configuration

1. Add a **Window Capture** source.
2. **Window:** select `reStrike MCM · Display`.
3. **Capture Method:** `Windows 10 (1903+)`.
4. **Capture Cursor:** off.
5. **Client Area:** on.
6. The source now has an alpha channel — compose it on top of any background scene element.

To preserve alpha in recordings: use `mov` container with QuickTime/RLE codec, or use NDI output. Streaming output (x264) flattens alpha.

### vMix configuration

1. Add a **DesktopCapture2** input.
2. Select the `reStrike MCM · Display` window.
3. The input carries alpha; place it above other inputs in your scene.

### Single-monitor controls

When transparent mode is on and there is no secondary monitor, the display window is borderless and has no chrome. Operator UI exposes three controls next to "Push to Display 2":

- **Move/resize** — toggle a translucent drag strip across the top and a corner drag handle. While on, always-on-top is suspended so you can place other windows.
- **Always on top** — stays on top of OBS, vMix, etc. (default on).
- **Close display** — close the window.
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbook.md
git commit -m "docs(runbook): OBS/vMix capture configuration for transparent display"
```

---

## Self-review checklist for the implementer

After completing all tasks:

- [ ] Run the full test suite: `pnpm test` — all green.
- [ ] Run typecheck: `pnpm typecheck` — clean.
- [ ] Run `pnpm build` — packaged installer succeeds.
- [ ] Manual smoke (single monitor): toggle transparent in Settings, verify display restarts, verify Move/AOT/Close controls appear, drag the window via the move handle.
- [ ] Manual smoke (OBS): follow the runbook steps, verify a PNG with alpha shows through into the OBS preview.
- [ ] Manual smoke (vMix): same with DesktopCapture2.
- [ ] Manual smoke (legacy session): load a saved session that pre-dates this feature; verify no errors, ceremonies inherit the global defaults for both new fields.
