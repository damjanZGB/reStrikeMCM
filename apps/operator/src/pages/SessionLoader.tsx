import React, { useEffect, useState } from 'react'
import type { Session } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'

interface Props { open: boolean; onClose(): void; onLoad(id: string): Promise<void> }

export function SessionLoader({ open, onClose, onLoad }: Props) {
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    api.session.list()
      .then(list => setSessions(list.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .catch(e => setError(String(e)))
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header><h3>Load session</h3><button onClick={onClose}>✕</button></header>
        <div className="modal-body">
          {error && <div className="toast toast-error">{error}</div>}
          {!sessions ? (
            <div className="loading">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">No saved sessions.</div>
          ) : (
            <ul className="session-list">
              {sessions.map(s => (
                <li key={s.id}>
                  <button
                    className="session-row"
                    onClick={async () => { await onLoad(s.id); onClose() }}>
                    <div className="sr-label">{s.label}</div>
                    <div className="sr-meta">
                      {s.ceremonies.length} ceremony{s.ceremonies.length === 1 ? '' : 'ies'}
                      {' · '}updated {new Date(s.updatedAt).toLocaleString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
