import { ipcMain, screen } from 'electron'
import { join } from 'node:path'
import { loadConfig } from '@restrike-mcm/core'
import { createDisplayWindow, closeDisplayWindow, loadDisplayContent } from '../windows.js'
import { ASSETS_ROOT, CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'

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

  ipcMain.handle('display:resolve-default-backdrop', async () => {
    const config = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    return join(ASSETS_ROOT, 'backgrounds', config.defaultBackground)
  })
}
