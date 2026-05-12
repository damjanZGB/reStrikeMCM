# Transparent background & disable-backdrop — Design

**Date:** 2026-05-12
**Status:** Approved
**Author:** Damjan (with Claude Code, Opus 4.7)

## Summary

Add the ability to run the display window with a true alpha-channel (transparent) background so that OBS/vMix capture preserves transparency, including PNG alpha in any selected backdrop image. Add an orthogonal option to disable the backdrop entirely (no image, no fallback). Both options have a global default in `AppConfig` and a per-ceremony tri-state override in `CeremonyDisplayOptions`.

## Goals

1. Display window can be opened with `transparent: true` so its compositor surface carries an alpha channel.
2. When a backdrop PNG has alpha, those transparent pixels remain transparent end-to-end (renderer → window surface → OBS Window Capture / vMix DesktopCapture2).
3. Operator can disable the backdrop image entirely (no fallback to bundled image).
4. Both options have a global default and a per-ceremony override.
5. When the only monitor is the primary (no secondary), the borderless transparent window remains operable: move/resize, always-on-top toggle, close.

## Non-goals (explicitly out of scope)

- Chroma-key fallback mode — user chose true-alpha pipeline only.
- Click-through display window via `setIgnoreMouseEvents`. Not needed; cursor is hidden.
- Custom alpha animations during the existing flag-fade phase. The current `.playout-content.flag-fading` opacity transition already composes correctly over an alpha window.

## Capture pipeline (assumptions)

- **OBS:** Window Capture, Capture Method = "Windows 10 (1903+)", Capture Cursor = off, Client Area = on. Alpha is preserved on the source. Output that preserves alpha (recording in QuickTime/MOV with alpha, NDI, or compositing within OBS scenes) is the user's responsibility.
- **vMix:** DesktopCapture2 source against the display window. Alpha preserved on source.
- These capture configurations are documented in `docs/runbook.md` as part of the rollout, not enforced by the app.

## Data model

### `AppConfig` (new fields)

```ts
transparentBackground: boolean  // default false — arms the alpha pipeline
backdropEnabled: boolean        // default true  — when false, no backdrop image is rendered
```

### `CeremonyDisplayOptions` (new fields, both tri-state)

```ts
transparentBackground?: boolean | undefined  // undefined = inherit global
backdropEnabled?: boolean | undefined        // undefined = inherit global
```

### Resolution (renderer-side, pure functions)

```
effectiveTransparent = ceremony.display.transparentBackground ?? config.transparentBackground ?? false
effectiveBackdropOn  = ceremony.display.backdropEnabled       ?? config.backdropEnabled       ?? true
```

### Zod schema updates (`packages/shared/src/schemas.ts`)

```ts
CeremonyDisplayOptionsSchema = z.object({
  // ...existing fields...
  transparentBackground: z.boolean().optional(),
  backdropEnabled: z.boolean().optional(),
})

AppConfigSchema = z.object({
  // ...existing fields...
  transparentBackground: z.boolean().default(false),
  backdropEnabled: z.boolean().default(true),
})
```

Existing sessions on disk have no fields — Zod defaults / `optional()` handle them. No data migration.

### `default-config.json`

```json
"transparentBackground": false,
"backdropEnabled": true,
```

## Behavior matrix (transparent × backdrop)

| transparent | backdrop | result |
|---|---|---|
| off | on | current behavior — solid `#0a0a14` under image |
| off | off | solid `#000` window, no image |
| on  | on | window has alpha; backdrop image renders; image's own alpha pixels become true window alpha |
| on  | off | fully transparent window — every pixel is alpha 0 |

## Display window lifecycle

`electron/windows.ts:createDisplayWindow` is changed to take options:

```ts
createDisplayWindow({ transparent: boolean }): BrowserWindow
```

The window is constructed differently when `transparent` is true:

| param | transparent: false (current) | transparent: true |
|---|---|---|
| `transparent` | (default) | `true` |
| `backgroundColor` | `'#000000'` | `'#00000000'` |
| `frame` | `!isFullscreen` | `false` (always) |
| `fullscreen` | `isSecondary` | `false` (always — Win+transparent+fullscreen is unreliable) |
| `hasShadow` | (default true) | `false` |
| size | fullscreen on secondary, 1280×720 on primary | always full display bounds (`target.bounds.width/height`) |

When `transparent && !hasSecondary`:
- `displayWin.setAlwaysOnTop(true, 'screen-saver')` is set at creation.
- Operator-side controls (see UI section) are required to move/resize/close.

`display:push` reads `config.transparentBackground` before calling `createDisplayWindow`.

### Restart on global toggle

Electron's `transparent` flag cannot be flipped after creation. The flow when the user toggles the global `transparentBackground` in Settings:

1. `config:set` handler detects the change.
2. If `getDisplayWindow()` is open, it is closed and re-created with the new flag.
3. Operator receives a one-shot toast: *"Display window restarted to apply transparency change."*

Toggling the per-ceremony override does **not** restart the window — it only changes the CSS class on the next ceremony or the current idle render.

### Edge cases

- `screen.on('display-added')` while in primary-only move mode: exit move mode and re-pin always-on-top.
- `screen.on('display-removed')`: existing handler closes display window — unchanged.

## Renderer (display app)

### Resolution and class toggling

`apps/display/src/App.tsx` learns:
- Global flags on mount via a new IPC `display:get-transparent-mode` (returns both `transparentBackground` and `backdropEnabled`).
- Per-ceremony overrides from `PlayoutInstruction.ceremony.display` (already wired).

A small helper computes:
```ts
function resolveDisplayMode(
  ceremony: Ceremony | null,
  global: { transparentBackground: boolean; backdropEnabled: boolean },
): { transparent: boolean; backdropOn: boolean }
```

The resolved `transparent` value is reflected by toggling a `transparent` class on `<html>`, `<body>`, `#root`, and `.display-root`. The resolved `backdropOn` is consumed by `PlayoutEngine` — when `false`, the `<div class="backdrop">` is not rendered at all and the backdrop URL is not resolved (saves a `file://` fetch).

### CSS changes (`apps/display/src/styles.css`)

```css
html.transparent, body.transparent, #root.transparent {
  background: transparent;
}
.display-root.transparent,
.display-root.transparent .backdrop {
  background: transparent;
  background-color: transparent;
}
```

The `.backdrop` rule keeps its `background-image` (set inline) — only the solid `background-color` is killed when transparent.

### Move-mode rendering (transparent + primary only)

When the renderer receives `moveMode: true` via `display:on-move-mode` IPC, it renders two non-capture-polluting handles:

```html
<div class="move-handle-top"></div>       <!-- 8px strip, -webkit-app-region: drag -->
<div class="move-handle-corner"></div>    <!-- 16x16 bottom-right, -webkit-app-region: drag -->
```

```css
.move-handle-top    { position: fixed; top:0; left:0; right:0; height:8px;
                      background: rgba(255,255,255,0.15); -webkit-app-region: drag; z-index: 9999; }
.move-handle-corner { position: fixed; bottom:0; right:0; width:16px; height:16px;
                      background: rgba(255,255,255,0.15); -webkit-app-region: drag; z-index: 9999; }
```

When `moveMode` returns to `false`, the elements are unmounted — no pixels left in capture.

## Operator UI

### Settings dialog (`apps/operator/src/pages/SettingsDialog.tsx`)

New section "Display output" placed above the existing "Default backdrop image" section:

- Checkbox: **Transparent background output (for OBS/vMix capture)**
  - Helper: *"Opens the display window with alpha channel. Restart of display window required when changed."*
- Checkbox: **Show backdrop image**

### Display options panel (`apps/operator/src/components/DisplayOptionsPanel.tsx`)

Two new `<select>` tri-state controls, placed between "Disable all texts and titles" and the "Background" section:

- **Transparency** — options:
  - `Use global default` → `undefined`
  - `Transparent` → `true`
  - `Opaque` → `false`
- **Backdrop** — options:
  - `Use global default` → `undefined`
  - `Show backdrop` → `true`
  - `Hide backdrop` → `false`

Selects are used (not checkboxes) so the inherit-from-global state is explicit.

### Operator main area — display window controls

A new compact "Display window" control group is rendered next to "Push to display 2" **only when**:
```
displayWindowOpen && globalTransparentBackground && !hasSecondaryMonitor
```

Controls:

- **Move/resize** — toggle. While on, the display renders drag handles and AOT is temporarily off.
- **Always on top** ✓ — sticky toggle; default ON.
- **Close display** — reuses existing `display:reset`.

`hasSecondaryMonitor` is detected by main process and pushed via `display:on-monitor-config-change` whenever `screen` emits `display-added` or `display-removed`.

## IPC surface

New channels in `electron/ipc/display-channels.ts`:

- `display:get-transparent-mode` → `{ transparentBackground: boolean; backdropEnabled: boolean }`
- `display:set-move-mode` → `(enabled: boolean)`; forwards a `display:move-mode-changed` event to the display renderer, and toggles AOT on the display window
- `display:set-always-on-top` → `(enabled: boolean)`; calls `setAlwaysOnTop(state, 'screen-saver')`
- Event `display:on-monitor-config-change` → operator subscribes; payload `{ hasSecondary: boolean }`

Existing channels reused: `display:push` (now reads transparency flag from config), `display:reset` (unchanged), `config:set` (extended with the restart-on-toggle logic).

`config-channels.ts` gains a post-set hook: after `config:set` writes the new config, if `transparentBackground` differs from the previous value AND the display window is open, close + re-open it.

`electron/preload.ts` and the two `ipc-bridge.ts` files (operator + display) gain typed wrappers around the new channels.

## Component / file changes

| File | Change |
|---|---|
| `packages/shared/src/types.ts` | Add 2 fields to `AppConfig` and 2 optional to `CeremonyDisplayOptions` |
| `packages/shared/src/schemas.ts` | Mirror in Zod with defaults |
| `default-config.json` | Add 2 keys |
| `electron/windows.ts` | `createDisplayWindow` accepts `{ transparent }`; conditional params |
| `electron/ipc/display-channels.ts` | 3 new channels + 1 event |
| `electron/ipc/config-channels.ts` | Post-set hook restarts display on transparency change |
| `electron/preload.ts` | Expose new channels |
| `electron/main.ts` | Subscribe to `screen` events for monitor-config push |
| `apps/display/src/ipc-bridge.ts` | Add `display.getTransparentMode`, `display.onMoveModeChange` |
| `apps/display/src/App.tsx` | Resolve mode, toggle classes, manage move-mode handles |
| `apps/display/src/PlayoutEngine.tsx` | Skip backdrop div when `backdropOn === false`; pass `transparent` class through |
| `apps/display/src/styles.css` | `.transparent` rules + move-handle styles |
| `apps/display/src/lib/resolve-display-mode.ts` *(new)* | Pure resolution function |
| `apps/operator/src/ipc-bridge.ts` | Wrappers for new channels & event |
| `apps/operator/src/components/DisplayOptionsPanel.tsx` | Two tri-state selects |
| `apps/operator/src/pages/SettingsDialog.tsx` | "Display output" section with two checkboxes |
| `apps/operator/src/pages/Session.tsx` | New display-window controls group rendered alongside the existing push button, conditional on `transparentMode && !hasSecondary` |

## Testing

### Unit / integration

- `packages/shared/src/__tests__/schemas.test.ts` — new fields parse with defaults; tri-state optional fields accept `true`/`false`/`undefined`.
- `packages/core/src/__tests__/config-store.test.ts` — round-trip load/save preserves new fields; missing keys get defaults.
- `apps/display/src/__tests__/resolve-display-mode.test.ts` *(new)* — full truth table for resolution (`undefined`/`true`/`false` × global on/off).

### E2E (Playwright)

- `tests/e2e/transparent-mode.spec.ts` — opens operator, toggles "Transparent background output" while display is open, asserts:
  - Display window closes and re-opens (window count blip).
  - New display window's DOM has `.transparent` class on `<html>` and `#root`.
  - With `backdropEnabled: false`, no `.backdrop` element in the DOM.
- Reuse existing Playwright config (`tests/e2e/playwright.config.ts`).

### Manual smoke (recorded in `docs/runbook.md`)

- OBS Window Capture (Windows 10 1903+ method, Cursor off, Client Area on) against the display window with:
  - `transparent=on, backdrop=on`, PNG-with-alpha backdrop → alpha visible in OBS preview.
  - `transparent=on, backdrop=off` → fully transparent in OBS preview.
- vMix DesktopCapture2 source — same two checks.
- Single-monitor: open display, verify Move/AOT/Close controls appear; verify move handles only render in move-mode and disappear when off; verify drag works.

## Rollout

1. Land schema + config changes first (smallest risk).
2. Land window-lifecycle changes + IPC.
3. Land renderer CSS/class logic + tests.
4. Land operator UI controls.
5. Update `docs/runbook.md` with OBS/vMix capture configuration.

No feature flag — toggle defaults to off, so existing behavior is unchanged on first launch after upgrade.
