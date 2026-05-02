import React from 'react'
import type { Ceremony } from '@restrike-mcm/shared'

interface Props {
  ceremonies: Ceremony[]
  activeId: string | null
  onSelect(id: string): void
  onAdd(): void
}

const STATUS_DESC: Record<Ceremony['status'], string> = {
  empty: 'empty',
  pending: 'pending',
  ready: 'ready',
  played: 'played',
}

export function QueuePanel({ ceremonies, activeId, onSelect, onAdd }: Props) {
  return (
    <aside className="queue-panel">
      <h4>Today's queue</h4>
      {ceremonies.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`queue-item ${c.id === activeId ? 'active' : ''} ${c.status === 'played' ? 'done' : ''}`}>
          <div className="qi-title">{c.category || '(unnamed)'} · {c.ageCategory || ''}</div>
          <div className="qi-meta">{STATUS_DESC[c.status]}{c.playedAt ? ` ${new Date(c.playedAt).toLocaleTimeString()}` : ''}</div>
        </button>
      ))}
      <button className="btn-secondary" onClick={onAdd}>+ Add ceremony</button>
    </aside>
  )
}
