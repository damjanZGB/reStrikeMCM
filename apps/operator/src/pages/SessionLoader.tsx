import React, { useEffect, useState } from 'react'
import type { Session } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'

interface Props { open: boolean; onClose(): void; onLoad(id: string): Promise<void>; activeSessionId?: string | undefined }

export function SessionLoader({ open, onClose, onLoad, activeSessionId }: Props) {
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setError(null)
    api.session.list()
      .then(list => setSessions(list.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .catch(e => setError(String(e)))
  }
  useEffect(() => { if (open) refresh() }, [open])

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete session "${label}"? This cannot be undone.`)) return
    try {
      await api.session.delete(id)
      refresh()
    } catch (e) {
      setError(String(e))
    }
  }

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
                <li key={s.id} className="session-li">
                  <button
                    className="session-row"
                    onClick={async () => { await onLoad(s.id); onClose() }}>
                    <div className="sr-label">{s.label}{s.id === activeSessionId ? ' · current' : ''}</div>
                    <div className="sr-meta">
                      {s.ceremonies.length} ceremony{s.ceremonies.length === 1 ? '' : 'ies'}
                      {' · '}updated {new Date(s.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <button
                    className="btn-danger session-delete"
                    title="Delete session"
                    disabled={s.id === activeSessionId}
                    onClick={() => handleDelete(s.id, s.label)}>
                    🗑
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
