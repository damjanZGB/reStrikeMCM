# reStrike MCM — Venue Runbook

## Pre-event setup (1 day before)

- [ ] Copy `dist/win-unpacked/` to venue laptop (or USB drive)
- [ ] Plug projector / LED wall into laptop's HDMI-out, set Windows display mode to "Extend"
- [ ] Launch `reStrikeMCM.exe`
- [ ] Click ⚙ Settings → confirm disciplines/age categories/rank labels match what your federation uses
- [ ] Click 📺 Push to Display 2 → confirm fullscreen black window on projector
- [ ] Add a test ceremony with one valid NOC → click Play → confirm anthem audible and banner rises
- [ ] Click Stop → close Display 2 → quit app

## Day-of medal block

- [ ] Open app → create new session, label it "Day X · Hall Y"
- [ ] Click + Add ceremony for each upcoming category in the medal block
- [ ] Push to Display 2 (verify projector shows backdrop)
- [ ] As each final concludes, fill its ceremony's 3 or 4 athletes; ensure all status dots green
- [ ] When medalists are walking on, click ▶ Play Ceremony
- [ ] Watch playout, verify timing, advance to next

## Manual rehearsal checklist (do once before first event)

- [ ] 4 medalists (TKD final) — full playout end-to-end
- [ ] 3 medalists (uncheck 4th medalist box) — confirm 3-banner layout
- [ ] Missing NOC — type "ZZZ" in any row → yellow dot → click Substitute → pick any MP3/JSON → green
- [ ] Very short anthem (< 30 s file) — confirm rise still readable
- [ ] Very long anthem (> 80 s file) — confirm fade-out is last 1.5 s, anthem doesn't play past file end
- [ ] Mid-play Stop — click ■ Stop → audio fades, banners stay where they are
- [ ] Display 2 unplugged mid-play — operator sees toast; replug → Push to Display 2 again
- [ ] Hand-edit `config.json` (add a discipline) → restart app → confirm new value appears in dropdown
- [ ] Hand-edit a `sessions/<id>.json` → restart app → confirm session loads correctly
- [ ] Run from a USB stick (latency/asset-load check) — anthem starts within 500 ms of clicking Play

## Known-good NOC test set
UZB · TUN · BRA · ITA · USA · KOR · CHN · GBR · FRA · GER

These all have anthems and Lottie flags in `assets/`.

## Troubleshooting
- **"Display window is not active"** when clicking Play → click 📺 Push to Display 2 first
- **No sound** → confirm Windows default audio device is the projector or main speakers; check Howler isn't blocked by Windows audio mixer
- **Banner doesn't rise** → check console (Ctrl+Shift+I in operator window) for Lottie load errors; confirm flag JSON file is valid
- **Config rejected** → restart app, copy `default-config.json` over `config.json` to reset

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
