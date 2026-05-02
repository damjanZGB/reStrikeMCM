import React from 'react'
import type { Ceremony } from '@restrike-mcm/shared'

interface Props {
  ceremonies: Ceremony[]
  activeId: string | null
  onSelect(id: string): void
  onAdd(): void
  onDelete(id: string): void
}

const STATUS_DESC: Record<Ceremony['status'], string> = {
  empty: 'empty',
  pending: 'pending',
  ready: 'ready',
  played: 'played',
}

export function QueuePanel({ ceremonies, activeId, onSelect, onAdd, onDelete }: Props) {
  return (
    <aside className="queue-panel">
      <h4>Today's queue</h4>
      {ceremonies.map(c => (
        <div key={c.id} className={`queue-item-row ${c.id === activeId ? 'active' : ''} ${c.status === 'played' ? 'done' : ''}`}>
          <button
            onClick={() => onSelect(c.id)}
            className="queue-item">
            <div className="qi-title">{c.category || '(unnamed)'} · {c.ageCategory || ''}</div>
            <div className="qi-meta">{STATUS_DESC[c.status]}{c.playedAt ? ` ${new Date(c.playedAt).toLocaleTimeString()}` : ''}</div>
          </button>
          <button
            className="qi-delete"
            title="Delete ceremony"
            onClick={() => {
              if (confirm(`Delete ceremony "${c.category || 'unnamed'}"?`)) onDelete(c.id)
            }}>
            🗑
          </button>
        </div>
      ))}
      <button className="btn-secondary" onClick={onAdd}>+ Add ceremony</button>
    </aside>
  )
}
