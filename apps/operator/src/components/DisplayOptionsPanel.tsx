import React from 'react'
import type { Ceremony, RiseCurve, NamesMode, RankLabelStyle } from '@restrike-mcm/shared'

interface Props {
  display: Ceremony['display']
  audioInfo: { filename: string; durationMs: number } | null
  onChange(d: Ceremony['display']): void
}

export function DisplayOptionsPanel({ display, audioInfo, onChange }: Props) {
  const set = <K extends keyof Ceremony['display']>(k: K, v: Ceremony['display'][K]) => onChange({ ...display, [k]: v })
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

      <h4>Audio</h4>
      {audioInfo ? (
        <div className="audio-block">
          🎵 <strong>{audioInfo.filename}</strong> · {(audioInfo.durationMs / 1000).toFixed(1)} s
          <div className="audio-sub">rise completes @ {(audioInfo.durationMs * 0.85 / 1000).toFixed(1)} s · fade-out 1.5 s</div>
        </div>
      ) : (
        <div className="audio-block muted">no anthem resolved yet</div>
      )}
    </aside>
  )
}
