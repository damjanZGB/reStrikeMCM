import { ipcMain, screen } from 'electron'
import { join } from 'node:path'
import { loadConfig } from '@restrike-mcm/core'
import { createDisplayWindow, closeDisplayWindow, loadDisplayContent, getDisplayWindow, getOperatorWindow } from '../windows.js'
import { ASSETS_ROOT, CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'

export function registerDisplayChannels() {
  ipcMain.handle('display:push', async () => {
    const existing = getDisplayWindow()
    if (existing) {
      existing.focus()
      return { ok: true, reason: 'Display 2 already active' }
    }
    const cfg = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    const win = createDisplayWindow({ transparent: cfg.transparentBackground })
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
    return config.defaultBackgroundCustomPath
      ?? join(ASSETS_ROOT, 'backgrounds', config.defaultBackground)
  })

  ipcMain.handle('display:get-mode', async () => {
    const config = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    return {
      transparentBackground: config.transparentBackground,
      backdropEnabled: config.backdropEnabled,
    }
  })

  ipcMain.handle('display:set-move-mode', (_e, enabled: boolean) => {
    const win = getDisplayWindow()
    if (!win) return
    // While moving, drop always-on-top so the user can see other windows;
    // re-pin it when leaving move mode (no secondary path — see windows.ts).
    win.setAlwaysOnTop(!enabled, 'screen-saver')
    win.webContents.send('display:move-mode-changed', enabled)
  })

  ipcMain.handle('display:set-always-on-top', (_e, enabled: boolean) => {
    const win = getDisplayWindow()
    if (!win) return
    win.setAlwaysOnTop(enabled, 'screen-saver')
  })

  ipcMain.handle('display:has-secondary', () => {
    return screen.getAllDisplays().length > 1
  })

  // Push monitor-config changes to operator so its UI can hide/show
  // the transparent-window controls when a secondary is plugged/unplugged.
  const broadcastMonitorConfig = () => {
    const hasSecondary = screen.getAllDisplays().length > 1
    getOperatorWindow()?.webContents.send('display:monitor-config-changed', { hasSecondary })
  }
  screen.on('display-added', broadcastMonitorConfig)
  screen.on('display-removed', broadcastMonitorConfig)
}
