import React, { useEffect, useRef, useState } from 'react'
import type { Ceremony, RiseCurve, NamesMode, RankLabelStyle } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'

interface Props {
  display: Ceremony['display']
  audioInfo: { filename: string; durationMs: number; path: string } | null
  onChange(d: Ceremony['display']): void
}

const shortName = (p: string) => p.split(/[\\/]/).pop() ?? p

function toFileUrl(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/')
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

type TriState = 'inherit' | 'true' | 'false'
const toTri = (v: boolean | undefined): TriState => v === undefined ? 'inherit' : v ? 'true' : 'false'
const fromTri = (v: TriState): boolean | undefined => v === 'inherit' ? undefined : v === 'true'

export function DisplayOptionsPanel({ display, audioInfo, onChange }: Props) {
  const set = <K extends keyof Ceremony['display']>(k: K, v: Ceremony['display'][K]) => onChange({ ...display, [k]: v })
  const audioRef = useRef<HTMLAudioElement>(null)
  const [previewing, setPreviewing] = useState(false)

  // Stop preview when the anthem path changes (athlete swap, ceremony switch, etc.)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPreviewing(false)
  }, [audioInfo?.path])

  const togglePreview = () => {
    if (!audioRef.current) return
    if (previewing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPreviewing(false)
    } else {
      audioRef.current.play().then(() => setPreviewing(true)).catch(err => console.error('audio play failed', err))
    }
  }

  const pickBackground = async () => {
    const path = await api.fs.pickFile([{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp'] }])
    if (path) set('backgroundOverride', path)
  }

  return (
    <aside className="display-options">
      <h4>Display options</h4>

      <label>Rank label style
        <select value={display.rankLabelStyle} onChange={e => set('rankLabelStyle', e.target.value as RankLabelStyle)}>
          <option value="position">Position (1ST · 2ND · 3RD)</option>
          <option value="medal">Medal (GOLD · SILVER · BRONZE)</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      <label>Rise curve
        <select value={display.riseCurve} onChange={e => set('riseCurve', e.target.value as RiseCurve)}>
          <option value="rise-hold">B · Rise &amp; Hold (default)</option>
          <option value="linear">A · Linear</option>
        </select>
      </label>

      <label>Names appearance
        <select value={display.namesMode} onChange={e => set('namesMode', e.target.value as NamesMode)}>
          <option value="title-card">C · Title-card before rise</option>
          <option value="fixed">A · Fixed from start</option>
          <option value="fade-in">B · Fade-in after rise</option>
        </select>
      </label>

      <label className="toggle-row">Subtle gold tint
        <input type="checkbox" checked={display.goldTint} onChange={e => set('goldTint', e.target.checked)} />
      </label>

      <label className="toggle-row">Disable all texts and titles
        <input type="checkbox" checked={!display.textsEnabled} onChange={e => set('textsEnabled', !e.target.checked)} />
      </label>

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

      <h4>Background</h4>
      <div className="bg-row">
        <span className="bg-current">
          {display.backgroundOverride ? `🖼️ ${shortName(display.backgroundOverride)}` : 'Default backdrop'}
        </span>
        <div className="bg-actions">
          <button className="btn-secondary" onClick={pickBackground}>Choose…</button>
          {display.backgroundOverride && (
            <button className="btn-secondary" onClick={() => set('backgroundOverride', undefined)}>Reset</button>
          )}
        </div>
      </div>

      <h4>Audio</h4>
      {audioInfo ? (
        <div className="audio-block">
          🎵 <strong>{audioInfo.filename}</strong> · {(audioInfo.durationMs / 1000).toFixed(1)} s
          <div className="audio-sub">rise completes @ {(audioInfo.durationMs * 0.85 / 1000).toFixed(1)} s · fade-out 1.5 s</div>
          <div className="audio-actions">
            <audio
              ref={audioRef}
              src={toFileUrl(audioInfo.path)}
              onEnded={() => setPreviewing(false)}
              preload="metadata"
            />
            <button className="btn-secondary" onClick={togglePreview}>
              {previewing ? '⏸ Stop preview' : '▶ Preview anthem'}
            </button>
          </div>
        </div>
      ) : (
        <div className="audio-block muted">no anthem resolved yet</div>
      )}
    </aside>
  )
}
