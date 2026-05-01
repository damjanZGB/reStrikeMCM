# reStrike MCM — Medal Ceremony Manager · Design Spec

**Date:** 2026-05-01
**Status:** Draft (awaiting user review)
**Project root:** `C:/Users/Damjan/source/repos/reStrikeMCM/`
**Primary use case:** World Taekwondo Kyorugi & Poomsae medal ceremonies; flexible enough for any sport with 3 or 4 medalists.

---

## 1 · Overview

reStrike MCM is a portable Windows desktop app (Electron) for running **arena medal-ceremony presentations** at sporting events. It drives a secondary display — a projector or LED wall — with a synchronized national anthem and an animated rising-flags ceremony for up to 4 medalists.

The operator runs the app on a single laptop connected to the venue's projection system. They pre-load the medal ceremonies for the day's session into a queue, then, when each ceremony moment arrives, click **Play**: the anthem of the gold medalist's country plays, vertical flag banners rise from below the screen to medal-ranked heights, and names appear at the moment dictated by ceremony settings.

The app is **fully portable** (no installation), **fully offline** (assets ship with the binary), and **fully editable** (all sport-specific terminology lives in a JSON config the operator can hand-edit).

## 2 · Goals

1. Enable a single venue staff member to run a medal block of 6–12 ceremonies with calm, predictable choreography.
2. Match Olympic / IOC ceremonial conventions: gold flag rises highest, anthem of gold medalist plays, flags reach top before final bars of the anthem.
3. Handle World Taekwondo's **double-bronze** convention (4 medalists, 2 sharing 3rd place) without compromising other sports' 3-medalist ceremonies.
4. Be usable across sports — taekwondo Kyorugi/Poomsae as primary, but Judo, Wrestling, Boxing, and any sport with podium ceremonies must work without code changes.
5. Run from a USB-stick-portable folder; assets and config can be added/edited without touching the binary.

## 3 · Non-goals (explicitly out of scope for v1)

- CSV/JSON import of ceremony data (planned Phase 2)
- Live integration with `reStrikeSGX`, scoring systems, or rundown software (planned Phase 2)
- Multiple simultaneous ceremonies / multi-venue support
- Internationalization beyond the operator-editable rank-label list
- Cloud sync, multi-laptop coordination, network-based control
- macOS / Linux builds (Windows-first; ports possible but not committed)
- Replacing the existing `reStrikeSGX/packages/graphics/modern-medal-ceremony` *broadcast overlay* (different use case)

## 4 · Scenarios

### 4.1 Tournament-day morning prep
Operator opens the app on the venue laptop, names the session ("Saturday Finals · Hall A"), and adds 8 ceremony entries to the queue (one per category they expect to be played that block). Each is empty — names will be filled in once finals conclude.

### 4.2 Filling a ceremony
A final concludes, operator selects the ceremony in the queue, types/pastes the 4 athlete names with their NOC codes (e.g., `RASHITOV Ulugbek` / `UZB`). Status dots turn green as anthem and flag files resolve. The Play button enables.

### 4.3 Running the playout
Medalists walk out toward the podium. Operator clicks **Push to Display 2** (already done at session start), confirms display is showing the title backdrop, then clicks **▶ Play Ceremony**. The display:
1. Shows a 3-second title card: category, age, discipline, athletes.
2. Begins playing the gold medalist's anthem.
3. Vertical flag banners rise from below to medal-ranked heights, gold reaching highest at ~85% of anthem duration.
4. Names fade in (in default mode) as banners arrive at their final positions.
5. Anthem fades out over the last ~1.5s while banners hold their final position.
6. Display returns to a neutral hold state; operator advances to the next ceremony.

### 4.4 Missing assets
Operator types `XYZ` for a competitor's NOC. The app cannot find `assets/anthems/XYZ.mp3` or `assets/flag_animations/XYZ.json`. Status dot turns yellow, an inline warning appears, and Play is blocked. Operator clicks "Substitute" → file picker → selects an alternate file, or the operator opens the `assets/` folder directly to drop the missing file in. Once resolved, status flips green.

### 4.5 Adding a new sport
A poomsae federation wants categories the app doesn't ship with. Operator opens the **Settings** dialog, edits the **Disciplines** list (or **Age categories**, or **Rank labels**), and the new values appear in dropdowns immediately. Saved to `config.json` next to the exe.

## 5 · Distribution & filesystem layout

The deliverable is a single folder containing the executable and all editable resources:

```
reStrikeMCM/                       ← deliverable folder (USB / install location)
├── reStrikeMCM.exe                portable Windows executable
├── assets/
│   ├── anthems/                   *.mp3 keyed by ISO 3-letter NOC code
│   ├── flag_animations/           *.json Lottie banners, vertical (~1:2 aspect), keyed by NOC
│   └── backgrounds/
│       ├── default-backdrop.jpg   ships with app
│       └── (operator uploads)
├── config.json                    operator-editable; sourced from default-config.json on first run if missing
├── sessions/                      auto-saved session files (one JSON per session)
└── resources/                     Electron runtime, app code (not user-facing)
```

### Path resolution
- **Production**: `process.execPath` → `path.dirname(...)` is the deliverable folder; `assets/`, `config.json`, `sessions/` are siblings of the exe.
- **Development**: project root is the base; same relative subpaths.
- A single helper, `getAppRoot()`, abstracts both modes. All FS reads/writes go through it.

### electron-builder configuration
```yaml
target: portable
extraFiles:
  - from: assets
    to: assets
  - from: default-config.json
    to: config.json   # only copied if not already present at install location
  - from: sessions
    to: sessions      # ships empty (or with example session)
asar: true            # app code stays packed; only assets/config/sessions are loose
```

`config.json` is created from `default-config.json` on first launch if absent — never overwritten on update.

## 6 · Architecture

### 6.1 Process model

| Process | Purpose |
|---|---|
| Electron **main** (Node) | Window lifecycle, IPC, file dialogs, FS access, asset path resolution, MP3 metadata reading, config persistence |
| **Operator renderer** (browser) | Form, queue, live preview, settings panel — talks only to main via IPC |
| **Display renderer** (browser) | Plays anthem, animates banners, shows title cards — receives a complete `PlayoutInstruction` payload from main, runs autonomously |

The two renderers do **not** communicate directly. The operator sends commands to main; main dispatches to display. This keeps display-renderer logic deterministic and replayable.

### 6.2 Workspace layout

```
reStrikeMCM/
├── electron/                      Electron main process
│   ├── main.ts                    app/window/IPC bootstrap
│   ├── ipc/
│   │   ├── ceremony-channels.ts   ceremony:play / ceremony:stop / ceremony:save
│   │   ├── display-channels.ts    display:push / display:reset
│   │   ├── config-channels.ts     config:get / config:set
│   │   └── assets-channels.ts     assets:resolve-noc / assets:list-backgrounds
│   ├── windows.ts                 createOperatorWindow / createDisplayWindow
│   └── paths.ts                   getAppRoot / getAssetsRoot / getSessionsRoot
├── apps/
│   ├── operator/                  Vite + React UI (operator console)
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── pages/
│   │       │   ├── Session.tsx           queue + active editor + settings panel
│   │       │   └── SettingsDialog.tsx    edit dropdown lists, defaults, rank labels
│   │       ├── components/
│   │       │   ├── QueuePanel.tsx
│   │       │   ├── CeremonyEditor.tsx
│   │       │   ├── AthleteRow.tsx
│   │       │   ├── DisplayOptionsPanel.tsx
│   │       │   ├── LivePreview.tsx
│   │       │   └── PlayBar.tsx
│   │       └── ipc-bridge.ts             thin wrapper around window.api.*
│   └── display/                   Vite + React renderer for Display 2
│       └── src/
│           ├── App.tsx
│           ├── PlayoutEngine.tsx          orchestrates phases (title-card → rise → fade-out)
│           ├── components/
│           │   ├── TitleCard.tsx
│           │   ├── BannerStage.tsx
│           │   ├── Banner.tsx              wraps lottie-web with rise transform
│           │   ├── NameTag.tsx
│           │   └── Backdrop.tsx
│           └── audio.ts                   Howler wrapper with fade
├── packages/
│   ├── shared/                    TS types shared by main + both renderers
│   │   └── src/
│   │       ├── types.ts                  Ceremony, Athlete, Session, PlayoutInstruction, AppConfig
│   │       ├── schemas.ts                zod schemas for all of the above
│   │       └── constants.ts              default heights (gold:100/silver:78/bronze:58), fade-out ms, etc.
│   ├── core/                      Node-only helpers (used in main process)
│   │   └── src/
│   │       ├── config-store.ts           load/save config.json with zod validation
│   │       ├── session-store.ts          load/save sessions/*.json
│   │       ├── asset-resolver.ts         resolveAnthemFor(noc), resolveFlagFor(noc)
│   │       └── audio-meta.ts             readMp3Duration via music-metadata
│   └── playout/                   Pure TS, no Node/DOM
│       └── src/
│           ├── rise-curves.ts            curve math (linear, rise-hold, staggered)
│           ├── compute-schedule.ts       computeRiseSchedule(durationMs, curve, athletes) → Keyframe[]
│           └── easing.ts                 easeOutCubic, easeInOut, etc.
├── assets/                        ships with the build
├── default-config.json            ships with the build
├── electron-builder.yml
├── package.json (pnpm root)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── docs/superpowers/specs/        this file
```

### 6.3 Why pnpm workspace
- Matches the pattern in sibling project `reStrikeSGX` — same dev ergonomics.
- Forces a clean import boundary: `@restrike-mcm/shared`, `@restrike-mcm/core`, `@restrike-mcm/playout`.
- `packages/playout` having no Node or DOM imports lets it run under Vitest with no setup.

### 6.4 IPC channels

All IPC channels are typed via `electron/ipc/types.ts` and surfaced to renderers via `contextBridge.exposeInMainWorld('api', {...})`.

| Channel | Direction | Payload | Response |
|---|---|---|---|
| `config:get` | renderer → main | — | `AppConfig` |
| `config:set` | renderer → main | `Partial<AppConfig>` | `AppConfig` |
| `session:list` | renderer → main | — | `Session[]` (metadata only) |
| `session:load` | renderer → main | `sessionId` | `Session` |
| `session:save` | renderer → main | `Session` | `void` |
| `assets:resolve-noc` | renderer → main | `noc: string` | `{ anthemPath: string\|null; flagPath: string\|null }` |
| `assets:audio-duration` | renderer → main | `path: string` | `{ durationMs: number }` |
| `display:push` | renderer → main | — | `{ ok: boolean; reason?: string }` |
| `display:reset` | renderer → main | — | `void` |
| `ceremony:play` | operator → main → display | `PlayoutInstruction` | display fires `ceremony:phase-change` events back |
| `ceremony:stop` | operator → main → display | — | `void` |
| `ceremony:phase-change` | display → main → operator | `{ phase: 'title-card'\|'rising'\|'holding'\|'fading-out'\|'ended'; t: number }` | — |

`PlayoutInstruction` is a single self-contained payload built by main from the active `Ceremony` + resolved asset paths + computed rise schedule. The display renderer never asks main for follow-ups during playback.

## 7 · Data model

All types defined in `packages/shared/src/types.ts`; runtime validation via zod in `packages/shared/src/schemas.ts`.

### 7.1 Athlete
```ts
type Rank = 'gold' | 'silver' | 'bronze1' | 'bronze2'

interface Athlete {
  rank: Rank
  name: string                  // "RASHITOV Ulugbek"
  noc: string                   // "UZB" — ISO 3-letter, uppercase
  status: 'empty' | 'pending' | 'ready'
  // pending = NOC entered but anthem or flag missing
  // operator-supplied substitutes:
  anthemOverride?: string       // absolute path to MP3 if substituting
  flagOverride?: string         // absolute path to Lottie JSON if substituting
}
```

`bronze1`/`bronze2` distinguish entry order only — the display always renders both as `3RD` (or whatever the rank-label config says).

### 7.2 Ceremony
```ts
interface Ceremony {
  id: string                    // uuid
  category: string              // "M −68 kg"
  ageCategory: string           // "Senior"
  discipline: string            // "Kyorugi"
  gender: 'M' | 'F' | 'X'
  bronzeCount: 1 | 2            // 1 = single bronze (most sports), 2 = TKD/Judo
  athletes: Athlete[]           // length = 3 if bronzeCount=1, length = 4 if bronzeCount=2
  display: CeremonyDisplayOptions
  status: 'empty' | 'pending' | 'ready' | 'played'
  playedAt?: string             // ISO timestamp when status='played'
}

interface CeremonyDisplayOptions {
  rankLabelStyle: 'position' | 'medal' | 'custom'
  riseCurve: 'linear' | 'rise-hold' | 'staggered'
  namesMode: 'fixed' | 'fade-in' | 'title-card'
  goldTint: boolean
  backgroundOverride?: string   // path inside assets/backgrounds/, or absolute
}
```

### 7.3 Session
```ts
interface Session {
  id: string
  label: string                 // "Saturday Finals · Hall A"
  createdAt: string             // ISO
  updatedAt: string             // ISO, auto on every save
  ceremonies: Ceremony[]
}
```
Sessions are stored as `sessions/<id>.json`. App auto-saves on every queue/ceremony edit (debounced 500 ms).

### 7.4 AppConfig (`config.json`)
```ts
interface AppConfig {
  version: 1                    // schema version, for forward migration
  disciplines: string[]
  ageCategories: string[]
  genders: string[]             // editable, default ['Men','Women','Mixed']
  rankLabels: {
    position: [string, string, string, string]  // ['1ST','2ND','3RD','3RD']
    medal:    [string, string, string, string]  // ['GOLD','SILVER','BRONZE','BRONZE']
    custom?:  [string, string, string, string]  // operator-defined, e.g., emoji
  }
  ceremonyTitleText: string     // default "MEDAL CEREMONY"
  defaultBackground: string     // path within assets/backgrounds/
  defaults: {
    riseCurve: 'linear' | 'rise-hold' | 'staggered'
    namesMode: 'fixed' | 'fade-in' | 'title-card'
    goldTint: boolean
    rankLabelStyle: 'position' | 'medal' | 'custom'
  }
  audio: { fadeOutMs: number }  // default 1500
  podium: {
    goldHeightPct: number       // default 100
    silverHeightPct: number     // default 78
    bronzeHeightPct: number     // default 58
  }
}
```

Every dropdown in the UI is sourced from this config; operator-added entries are appended back automatically.

### 7.5 PlayoutInstruction (sent to display renderer)
```ts
interface PlayoutInstruction {
  ceremony: Ceremony            // full ceremony for context
  resolvedAssets: {
    anthemPath: string          // absolute path
    flagPaths: { gold:string; silver:string; bronze1:string; bronze2?:string }
    backgroundPath: string
  }
  schedule: RiseSchedule        // computed from anthem duration + chosen curve
  config: Pick<AppConfig, 'rankLabels'|'ceremonyTitleText'|'audio'|'podium'>
}

type RiseSchedule = {
  totalMs: number
  fadeOutMs: number
  keyframes: Array<{
    rank: Rank
    fromPct: number             // -100 (off-screen) typically
    toPct: number               // final height (gold:0 = top, silver:22, bronze:42)
    startMs: number
    endMs: number
    easing: 'linear' | 'easeOutCubic' | 'easeInOutCubic'
  }>
}
```

## 8 · Operator UI specification

### 8.1 Window
- Resizable, default 1280×800.
- Dark theme (no light mode in v1).
- Single page: `Session.tsx` with three columns + a play bar.

### 8.2 Title bar
- Left: app icon + name + active session label (clickable to rename).
- Right: `⚙ Settings` button, `📺 Push to Display 2` button.
- "Push to Display 2" creates a fullscreen `BrowserWindow` on the highest-numbered display (or selected display if a chooser is needed). Once pushed, the button changes to `📺 Display 2 ON · ✕`.

### 8.3 Left column — Queue (240 px)
- Heading: "Today's queue".
- List of `Ceremony` cards, each showing: category + age, status meta, color-coded left border (active = gold, played = green, pending/empty = grey).
- Click a card to make it active.
- "+ Add ceremony" button at the bottom.
- Right-click on a card → context menu: Rename, Duplicate, Delete, Move up/down.

### 8.4 Center column — Active ceremony editor
- Heading: live category + age + discipline summary.
- Form fields, in this order:
  - Category / weight (free text)
  - Age category (combobox sourced from `config.ageCategories`)
  - Discipline (combobox sourced from `config.disciplines`)
  - Gender (combobox sourced from `config.genders`)
- "Medalists" subheading.
- 3 or 4 athlete rows (depending on `bronzeCount`):
  - Position label (1ST/2ND/3RD/3RD) — left, color-coded medal stripe
  - Name input (large)
  - NOC input (uppercased on blur, 3 chars)
  - Status dot (green/yellow/grey, hover = tooltip explaining)
  - Yellow status → small "Substitute…" inline button → file picker
- Checkbox: "4th medalist enabled" (toggles `bronzeCount` between 1 and 2).
- Live preview (16:9, ~280 px wide): renders the final-position layout based on current form state, using actual flag colors if NOCs resolve.

### 8.5 Right column — Display options (280 px)
Per-ceremony settings (saved with the ceremony, not global):
- Rank label style: dropdown (Position / Medal / Custom)
- Rise curve: dropdown (Rise & Hold default / Linear / Staggered)
- Names appearance: dropdown (Title-card default / Fixed / Fade-in after rise)
- Subtle gold tint: toggle
- Background image: button to upload (or use default)

Audio info block (read-only):
- Resolved gold-anthem filename and duration in seconds
- Computed rise-completion timestamp (e.g., "rise completes @ 49.6 s · fade-out 1.5 s")

### 8.6 Play bar (bottom)
- Big gold ▶ Play Ceremony button (disabled if any athlete row is not 'ready')
- ↻ Reset button (clears the active ceremony's athletes only)
- ■ Stop button (mid-playback halt — fades anthem, banners stay where they are)
- Right-aligned: total ceremony duration pill (`⏱ ~ 1:00`)

### 8.7 Settings dialog
Modal opened by `⚙ Settings`. Tabs:
- **Disciplines** — editable list, add/remove/reorder
- **Age categories** — editable list, add/remove/reorder
- **Genders** — editable list (default 3 items)
- **Rank labels** — three preset rows (Position, Medal, Custom) each with 4 editable text fields
- **Defaults** — pickers for default riseCurve/namesMode/goldTint/rankLabelStyle
- **Display** — podium height percentages (advanced, with reset-to-defaults button)
- **Audio** — fade-out duration in ms
- **About** — version, asset folder path, "Open assets folder", "Open config.json"

All edits save to `config.json` on dialog close.

## 9 · Display 2 specification

### 9.1 Window
- Fullscreen, no chrome, on the secondary display.
- Black background by default.
- Cursor hidden.
- Resilient to display disconnect (re-shows on reconnect; main process listens for `display-removed` / `display-added`).

### 9.2 Phases of a playout

```
idle      ──► title-card ──► rising ──► holding ──► fading-out ──► ended ──► idle
                                          ▲
                                   names fade-in here (mode b)
                                          
mode a (fixed):       names visible from start of "rising"
mode c (title-card):  names appear during "title-card" phase, hide during "rising", reappear at "holding" start
```

### 9.3 Title-card phase (3 s, only in `namesMode = 'title-card'`)
- Backdrop image faded in
- Centered text block: category, age, discipline (small caps row), then "MEDAL CEREMONY" (gold, large), then a 3-row list of athletes with rank pill + name + NOC
- Fades out as `rising` phase begins

### 9.4 Rising phase
- Backdrop visible
- Top text: small-caps category line, then "MEDAL CEREMONY" in gold (smaller than title card, top 5–11 % of screen)
- Banner stage: row of 3 or 4 vertical Lottie banners
  - All banners identical width, aspect ratio 1:2
  - Each starts at `bottom: -100%` (off-screen)
  - Animates `transform: translateY()` per its keyframe schedule
  - Internal Lottie loop continues throughout
  - For `goldTint = true`: gold banner gets `box-shadow: 0 0 24px rgba(255,215,0,0.55)` — applied as a class, no other size differences
- Names hidden in modes `fade-in` and `title-card`; visible in mode `fixed`

### 9.5 Holding phase
- Banners at final positions (gold 100 %, silver 78 %, bronze 58 % of stage height)
- Names visible in all modes — fade in if mode = `fade-in` (200 ms each, staggered by 100 ms)
- Anthem still playing
- Phase lasts until anthem fade-out begins

### 9.6 Fading-out phase
- Audio fade volume from 1 → 0 over `audio.fadeOutMs` (default 1500)
- Banners stay at final position
- Names stay visible
- After fade-out completes, dispatch `ended` phase

### 9.7 Ended → Idle
- After `ended`, holds final frame for 2 s, then fades back to backdrop-only (idle)
- Operator can press Reset to clear immediately

### 9.8 Aspect-ratio handling
- The display root is a flex container that **letterboxes** to a 16:9 inner stage when the physical display is wider or taller than 16:9
- Backdrop fills the whole physical display; banner stage is scaled to fit the 16:9 region
- Tested target ratios: 16:9 (primary), 4:3 (legacy projectors), 21:9 (LED walls), 9:16 (vertical screens — unusual, must not break)

## 10 · Playout flow (sequence)

```
1. Operator clicks ▶ Play Ceremony
2. Operator renderer → main: ipc('ceremony:play', activeCeremonyId)
3. Main:
   a. Loads ceremony from session-store
   b. Resolves anthem path (gold's NOC) via asset-resolver
   c. Resolves all flag paths
   d. Resolves background path (override or config default)
   e. Reads anthem MP3 duration via music-metadata
   f. Calls computeRiseSchedule(durationMs, ceremony.display.riseCurve, ceremony.athletes)
   g. Builds PlayoutInstruction
   h. Sends instruction to display renderer via webContents.send('ceremony:play', instruction)
4. Display renderer:
   a. PlayoutEngine receives instruction, sets state machine to 'title-card' (or directly 'rising' if mode != title-card)
   b. Title-card phase (if applicable, 3000 ms)
   c. Audio: Howl({ src: anthemPath }).play(); schedule .fade(1, 0, audio.fadeOutMs) at (durationMs - fadeOutMs)
   d. Banner stage: each banner reads its keyframe from schedule and animates `transform: translateY()`
      via CSS transitions (GPU-accelerated, hand-off to compositor). Easing is set by inline custom-property
      (`cubic-bezier` derived from the schedule's easing name). rAF is reserved for cases the schedule cannot
      express as a single CSS transition (e.g., the staggered curve uses two CSS transitions per banner,
      sequenced via `transitionend`).
   e. On each banner reaching its final position, dispatches phase-change event
   f. After all banners reach final, transitions to 'holding'
   g. At fade-out start, transitions to 'fading-out'
   h. After fade-out, transitions to 'ended'
5. Main marks ceremony.status = 'played' and saves session
```

## 11 · Asset resolution & missing-file handling

### 11.1 Resolution algorithm
For NOC `XYZ`:
1. Check `<assetsRoot>/anthems/XYZ.mp3` — if exists, use.
2. If athlete has `anthemOverride`, use it.
3. Otherwise return null.

Same for flags: `<assetsRoot>/flag_animations/XYZ.json`.

NOC is uppercased before lookup; assets are expected uppercased on disk.

### 11.2 Athlete status state machine
```
empty   ─name typed─►  empty (still no NOC)
empty   ─NOC typed─►  pending  (queries asset resolver)
pending ─assets ok─►  ready
pending ─missing──►  pending (yellow dot, must substitute)
ready   ─edit────►  re-evaluate
```

### 11.3 Substitute flow
- Yellow status dot's tooltip shows what's missing (anthem, flag, or both).
- Clicking the row's "Substitute" button opens a file dialog filtered to `.mp3` (anthem) or `.json` (flag).
- Selected absolute path stored on the athlete (`anthemOverride` / `flagOverride`).
- Status flips green only when both required files are accounted for.

### 11.4 Hot-reload of assets
- The `assets/` folder is watched (via `chokidar`) by main process.
- On add/remove, main broadcasts `assets:changed` to operator renderer.
- Pending athletes whose missing file just appeared auto-flip to ready.

## 12 · Configuration system

### 12.1 First-run bootstrap
- On launch, main checks for `config.json` next to exe.
- If missing, copies `default-config.json` (shipped as `extraFile`) to `config.json`.
- Validates with zod; on failure, logs error and uses in-memory defaults (does **not** overwrite operator's bad config).

### 12.2 Editable items
Everything in `AppConfig` is editable via the Settings dialog. The dialog exposes:
- Add/remove/reorder for list types
- Validated text inputs for label types (length cap 24 chars to keep badges readable)
- Numeric inputs with bounds for height percentages (range 30–100) and fade-out (range 0–5000 ms)

### 12.3 Schema migration
- `config.version` field reserved for future migrations.
- v1 launches with `version: 1`. Future versions get a migration step in `config-store.ts` that runs once on load.

## 13 · Error handling

Boundary errors (filesystem, audio, IPC) surface in the operator UI immediately. Internal errors are logged to `app.log` next to the exe.

| Failure | Surface | Behavior |
|---|---|---|
| `config.json` invalid | Toast on launch | Falls back to defaults; offers "Reset config" button that overwrites with shipped defaults |
| MP3 unreadable | Inline on athlete row | Shows "audio file corrupted" red badge; treat as missing |
| NOC has no anthem/flag | Yellow status dot | Operator must substitute |
| Display 2 disconnected mid-play | Toast in operator window | Audio continues on operator side until natural fade-out; main re-shows display window when reconnected |
| Display 2 not detected at "Push" | Toast | Falls back to opening on operator's primary; user can drag manually |
| Lottie file invalid JSON | Inline on athlete row | Treated as missing flag |

No silent failures. No try/catch swallowing. Every catch logs and surfaces.

## 14 · Testing strategy

### 14.1 Unit tests (`vitest`, in `packages/playout` and `packages/core`)
- `computeRiseSchedule` — snapshot keyframes for each curve at 30 s, 60 s, 80 s, 90 s anthems.
- `easeOutCubic` boundary values (0 → 0, 1 → 1, monotonic).
- `resolveAnthemFor` / `resolveFlagFor` — given test fixture `assets/`, return correct path or null.
- Zod schemas — accept valid configs, reject invalid (negative percentages, missing fields, etc.).

### 14.2 Integration tests (`playwright-electron`)
- Boot app, create session, add ceremony, fill 4 athletes with known-good NOCs, verify status dots green.
- Trigger Play, intercept display renderer's phase-change events, assert sequence: `title-card` → `rising` → `holding` → `fading-out` → `ended`.
- Test missing-NOC flow: type bad NOC, verify yellow dot, substitute via mocked file dialog, verify green.

### 14.3 Manual venue rehearsal checklist (in `docs/runbook.md`)
- 4 medalists (full TKD ceremony)
- 3 medalists (single bronze)
- One missing NOC, substituted manually
- Very short anthem (< 30 s) — confirm rise still readable
- Very long anthem (> 80 s) — confirm fade-out is still last 1.5 s, not affected by anthem length
- Display 2 unplugged mid-play, replugged
- Operator-edited `config.json` while app is running (assets watcher should pick up; config does not — restart noted)
- Hand-edit `sessions/<id>.json` between runs to confirm robustness
- Run from a USB stick (latency check)

## 15 · Build & dev workflow

### 15.1 Dev
```
pnpm install
pnpm dev          # electron-vite dev: HMR for both renderers + watch for main
```

### 15.2 Build
```
pnpm build        # electron-vite build → electron-builder --win portable
# Output: dist/reStrikeMCM-<version>.exe (~150 MB) + dist/reStrikeMCM/ folder
```

### 15.3 CI (out of scope for v1, noted for Phase 2)
- GitHub Actions: build on push, attach .exe artifact to GitHub Release
- Lint + typecheck + unit tests on PR

## 16 · Phase 2 / future work

- CSV / JSON ceremony import (workflow option C from brainstorming)
- Live integration with `reStrikeSGX` rundown (HTTP/WS endpoint to receive ceremony triggers)
- Hot-reload of `config.json` (not just assets)
- macOS / Linux portable builds
- "Athlete database" for autocomplete on name/NOC entry
- Per-session export (ZIP of session JSON + custom backgrounds + log)
- Optional broadcast-side overlay output (re-uses `reStrikeSGX/modern-medal-ceremony` graphic)

## 17 · Glossary

| Term | Meaning |
|---|---|
| **NOC** | National Olympic Committee; 3-letter code (UZB, USA, BRA…) used as filename prefix throughout assets |
| **Kyorugi** | Olympic-style sparring discipline of taekwondo |
| **Poomsae** | Forms / patterns discipline of taekwondo |
| **Repechage** | Knockout-format consolation bracket; in TKD, produces the 2 bronze medalists |
| **Lottie** | JSON-based vector animation format from Airbnb; renders via `lottie-web` |
| **OGraf** | EBU broadcast graphics specification used by `reStrikeSGX` (not used here) |
| **Display 2** | Generic name for the secondary monitor / projector / LED wall the audience sees |

## 18 · Appendix A · Rise-curve math

All curves operate in normalized time `t ∈ [0, 1]` where `t = elapsed / anthemDuration`.

### A.1 Linear
For each banner of rank `r`:
```
position(t) = start + (target_r - start) × t
```
where `start = -100%` (off-screen below) and `target_r` ∈ {0%, 22%, 42%} for gold/silver/bronze.

### A.2 Rise & Hold (default)
Rise window ends at `t = 0.85`:
```
if t < 0.85:  position(t) = start + (target_r - start) × easeOutCubic(t / 0.85)
else:         position(t) = target_r
```
Easing: `easeOutCubic(x) = 1 - (1-x)^3` so the rise decelerates as it approaches the top.

### A.3 Staggered
Three offset windows. Bronzes rise during `t ∈ [0.0, 0.4]`, silver during `[0.2, 0.6]`, gold during `[0.4, 0.85]`. Each uses easeOutCubic within its window; before its window the banner is off-screen, after its window it holds.

```
function staggered(rank, t):
  window = rank === 'gold'   ? [0.40, 0.85]
         : rank === 'silver' ? [0.20, 0.60]
         :                     [0.00, 0.40]
  if t < window.start: return start
  if t > window.end:   return target_r
  local = (t - window.start) / (window.end - window.start)
  return start + (target_r - start) × easeOutCubic(local)
```

### A.4 Audio fade-out
Independent of curve. Always:
```
audio.volume(t) = 1 if t < 1 - fadeOutMs/durationMs
                 linearly to 0 from there to t = 1
```

## 19 · Appendix B · Decisions log (from brainstorming)

| # | Decision | Rationale |
|---|---|---|
| 1 | Standalone Electron app (not part of reStrikeSGX monorepo) | Different use case (venue presentation vs broadcast overlay); simpler deploy |
| 2 | Session + queue workflow | Tournaments cluster ceremonies; pre-loading reduces stress at moment-of-truth |
| 3 | Olympic Podium layout, order Silver-Gold-Bronze-Bronze | IOC-correct order for combat sports with 2 bronzes |
| 4 | 4th medalist optional | Most sports have 1 bronze; TKD/Judo/Wrestling have 2 |
| 5 | Vertical banners, no flagpoles | Matches existing Lottie aspect (1:2); cleaner; cultural fit for TKD |
| 6 | Uniform flag size | Protocol-correct; only height differs; one animation type |
| 7 | Anthems ~60 s, fade out at end | User-supplied files |
| 8 | Gold tint optional, default off | "Only difference in height or position" plus explicit gold-tint toggle |
| 9 | Rise curve default = Rise & Hold @ 85 % | Fits 60 s + fade-out anthem perfectly; IOC-traditional |
| 10 | Names mode default = Title-card before rise | Most ceremonial; Olympic broadcast pattern |
| 11 | Background: default ships, per-ceremony override available | Default is good enough most of the time |
| 12 | Missing-asset handling: warn + manual substitute | Forces operator awareness during prep; never silent at showtime |
| 13 | All dropdowns/labels editable in `config.json` | Sport-flexibility without code changes |
| 14 | Operator UI: clean dark theme | Professional, gets out of the way |
| 15 | Portable .exe with adjacent assets/config | Single-folder operation, USB-stick portable |
