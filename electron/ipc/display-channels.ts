import { ipcMain } from 'electron'
import { createDisplayWindow, closeDisplayWindow } from '../windows.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function registerDisplayChannels() {
  ipcMain.handle('display:push', async () => {
    const win = createDisplayWindow()
    if (!win) return { ok: false, reason: 'No secondary display detected' }
    if (process.env.ELECTRON_RENDERER_URL) {
      await win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/display/`)
    } else {
      await win.loadFile(join(__dirname, '../renderer/display/index.html'))
    }
    return { ok: true }
  })
  ipcMain.handle('display:reset', () => {
    closeDisplayWindow()
  })
}
