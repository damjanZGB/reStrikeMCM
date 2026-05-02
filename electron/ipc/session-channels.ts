import { ipcMain } from 'electron'
import { listSessions, loadSession, saveSession, deleteSession } from '@restrike-mcm/core'
import type { Session } from '@restrike-mcm/shared'
import { SESSIONS_ROOT } from '../paths.js'

export function registerSessionChannels() {
  ipcMain.handle('session:list', () => listSessions(SESSIONS_ROOT))
  ipcMain.handle('session:load', (_e, id: string) => loadSession(SESSIONS_ROOT, id))
  ipcMain.handle('session:save', (_e, s: Session) => saveSession(SESSIONS_ROOT, s))
  ipcMain.handle('session:delete', (_e, id: string) => deleteSession(SESSIONS_ROOT, id))
}
