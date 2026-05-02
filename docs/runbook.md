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
