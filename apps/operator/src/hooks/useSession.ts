import { useEffect, useRef, useState, useCallback } from 'react'
import type { Session } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'
import { randomUUID } from './uuid.js'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  const createNew = useCallback((label: string) => {
    const now = new Date().toISOString()
    const s: Session = { id: randomUUID(), label, createdAt: now, updatedAt: now, ceremonies: [] }
    setSession(s)
  }, [])

  const load = useCallback(async (id: string) => {
    const s = await api.session.load(id)
    setSession(s)
  }, [])

  const update = useCallback((updater: (s: Session) => Session) => {
    setSession(prev => prev ? updater(prev) : prev)
  }, [])

  // debounced auto-save
  useEffect(() => {
    if (!session) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.session.save(session).catch(err => console.error('session save failed', err))
    }, 500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [session])

  return { session, createNew, load, update }
}
