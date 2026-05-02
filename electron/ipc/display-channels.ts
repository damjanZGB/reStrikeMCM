import { ipcMain } from 'electron'
import { createDisplayWindow, closeDisplayWindow } from '../windows.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function registerDisplayChannels() {
  ipcMain.handle('display:push', async () => {
    const win = createDisplayWindow()
    if (!win) return { ok: false, reason: 'No secondary display detected' }
    win.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[main] display did-fail-load ${code} ${desc} ${url}`)
    })
    if (process.env.ELECTRON_RENDERER_URL) {
      await win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/apps/display/`)
    } else {
      await win.loadFile(join(__dirname, '../renderer/apps/display/index.html'))
    }
    return { ok: true }
  })
  ipcMain.handle('display:reset', () => {
    closeDisplayWindow()
  })
}
