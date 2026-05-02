import React from 'react'
import type { Ceremony } from '@restrike-mcm/shared'

interface Props {
  ceremony: Ceremony | null
  durationMs: number | null
  onPlay(): void
  onReset(): void
  onStop(): void
}

export function PlayBar({ ceremony, durationMs, onPlay, onReset, onStop }: Props) {
  const allReady = ceremony?.athletes.every(a => a.status === 'ready') ?? false
  return (
    <footer className="play-bar">
      <button className="btn-primary" disabled={!allReady} onClick={onPlay}>▶ PLAY CEREMONY</button>
      <button className="btn-secondary" onClick={onReset}>↻ Reset</button>
      <button className="btn-danger" onClick={onStop}>■ Stop</button>
      <span className="duration-pill">⏱ {durationMs ? `${(durationMs / 1000).toFixed(0)} s` : '—'}</span>
    </footer>
  )
}
