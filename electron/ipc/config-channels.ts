import { ipcMain } from 'electron'
import { loadConfig, saveConfig } from '@restrike-mcm/core'
import { AppConfigSchema, type AppConfig } from '@restrike-mcm/shared'
import { CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'
import { setPlayShortcut } from '../shortcut-manager.js'
import { getDisplayWindow, closeDisplayWindow, createDisplayWindow, loadDisplayContent, getOperatorWindow } from '../windows.js'

let cached: AppConfig | null = null

export function registerConfigChannels() {
  ipcMain.handle('config:get', async () => {
    if (cached) return cached
    cached = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    return cached
  })

  ipcMain.handle('config:set', async (_e, partial: Partial<AppConfig>) => {
    const current = cached ?? await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    const next = AppConfigSchema.parse({ ...current, ...partial })
    await saveConfig(CONFIG_PATH, next)
    cached = next

    if (partial.playShortcut !== undefined && partial.playShortcut !== current.playShortcut) {
      setPlayShortcut(next.playShortcut)
    }

    // Electron's transparent flag can't change post-creation, so a flip
    // requires closing and re-opening the display window. Notify the operator.
    if (partial.transparentBackground !== undefined
        && partial.transparentBackground !== current.transparentBackground
        && getDisplayWindow()) {
      closeDisplayWindow()
      const win = createDisplayWindow({ transparent: next.transparentBackground })
      win.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.error(`[main] display did-fail-load ${code} ${desc} ${url}`)
      })
      await loadDisplayContent(win)
      getOperatorWindow()?.webContents.send('display:restarted-for-transparency', {
        transparentBackground: next.transparentBackground,
      })
    }

    return next
  })
}
