import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { SessionSchema, type Session } from '@restrike-mcm/shared'

export async function saveSession(sessionsDir: string, session: Session): Promise<void> {
  await mkdir(sessionsDir, { recursive: true })
  const validated = SessionSchema.parse({ ...session, updatedAt: new Date().toISOString() })
  await writeFile(join(sessionsDir, `${validated.id}.json`), JSON.stringify(validated, null, 2))
}

export async function loadSession(sessionsDir: string, sessionId: string): Promise<Session> {
  const raw = await readFile(join(sessionsDir, `${sessionId}.json`), 'utf-8')
  return SessionSchema.parse(JSON.parse(raw))
}

export async function listSessions(sessionsDir: string): Promise<Session[]> {
  try {
    const files = await readdir(sessionsDir)
    const sessions: Session[] = []
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      try {
        const raw = await readFile(join(sessionsDir, f), 'utf-8')
        sessions.push(SessionSchema.parse(JSON.parse(raw)))
      } catch (err) {
        console.warn(`[session-store] skipping invalid session file ${f}:`, err)
      }
    }
    return sessions
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}
