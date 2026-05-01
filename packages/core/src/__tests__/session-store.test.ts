import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listSessions, loadSession, saveSession } from '../session-store.js'
import type { Session } from '@restrike-mcm/shared'
import { randomUUID } from 'node:crypto'

let dir: string
const makeSession = (label: string): Session => ({
  id: randomUUID(),
  label,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ceremonies: [],
})

beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'mcm-sess-')) })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

describe('saveSession + loadSession', () => {
  it('round-trips a session', async () => {
    const s = makeSession('Test Session')
    await saveSession(dir, s)
    const loaded = await loadSession(dir, s.id)
    expect(loaded.label).toBe('Test Session')
  })

  it('throws when session id not found', async () => {
    await expect(loadSession(dir, 'nonexistent')).rejects.toThrow()
  })
})

describe('listSessions', () => {
  it('returns empty array for empty directory', async () => {
    const list = await listSessions(dir)
    expect(list).toEqual([])
  })

  it('returns metadata for all sessions in dir', async () => {
    await saveSession(dir, makeSession('A'))
    await saveSession(dir, makeSession('B'))
    const list = await listSessions(dir)
    expect(list).toHaveLength(2)
    expect(list.map(s => s.label).sort()).toEqual(['A', 'B'])
  })
})
