import { ipcMain, screen } from 'electron'
import { createDisplayWindow, closeDisplayWindow, loadDisplayContent } from '../windows.js'

export function registerDisplayChannels() {
  ipcMain.handle('display:push', async () => {
    const win = createDisplayWindow()
    win.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[main] display did-fail-load ${code} ${desc} ${url}`)
    })
    await loadDisplayContent(win)
    const hasSecondary = screen.getAllDisplays().length > 1
    return hasSecondary
      ? { ok: true }
      : { ok: true, reason: 'Only one display detected — running on primary' }
  })
  ipcMain.handle('display:reset', () => {
    closeDisplayWindow()
  })
}
