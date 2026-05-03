import { app, BrowserWindow, dialog, ipcMain, screen } from 'electron'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import chokidar from 'chokidar'
import { loadConfig } from '@restrike-mcm/core'
import { ASSETS_ROOT, CONFIG_PATH, DEFAULT_CONFIG_PATH, SESSIONS_ROOT } from './paths.js'
import { createOperatorWindow, getOperatorWindow, getDisplayWindow, closeDisplayWindow } from './windows.js'
import { setPlayShortcut, unregisterAllShortcuts } from './shortcut-manager.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
import { registerConfigChannels } from './ipc/config-channels.js'
import { registerSessionChannels } from './ipc/session-channels.js'
import { registerAssetsChannels } from './ipc/assets-channels.js'
import { registerDisplayChannels } from './ipc/display-channels.js'
import { registerCeremonyChannels } from './ipc/ceremony-channels.js'

async function bootstrap() {
  await mkdir(SESSIONS_ROOT, { recursive: true })
  await mkdir(ASSETS_ROOT, { recursive: true })
  registerConfigChannels()
  registerSessionChannels()
  registerAssetsChannels()
  registerDisplayChannels()
  registerCeremonyChannels()

  ipcMain.handle('fs:pick-file', async (_e, filters: { name: string; extensions: string[] }[]) => {
    const r = await dialog.showOpenDialog({ properties: ['openFile'], filters })
    return r.canceled ? null : r.filePaths[0] ?? null
  })

  const watcher = chokidar.watch(ASSETS_ROOT, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  })
  // Coalesce burst events (e.g., bulk file paste) into one renderer notification.
  let assetsChangedTimer: NodeJS.Timeout | null = null
  const notifyAssetsChanged = () => {
    if (assetsChangedTimer) clearTimeout(assetsChangedTimer)
    assetsChangedTimer = setTimeout(() => {
      getOperatorWindow()?.webContents.send('assets:changed')
    }, 300)
  }
  watcher.on('add', notifyAssetsChanged)
  watcher.on('unlink', notifyAssetsChanged)

  // Notify operator if the secondary display vanishes (cable unplug, OS rearrange).
  screen.on('display-removed', () => {
    if (getDisplayWindow()) {
      closeDisplayWindow()
      getOperatorWindow()?.webContents.send('display:lost')
    }
  })

  // Global PLAY hotkey — accelerator from config (default Ctrl+Alt+P).
  // Re-registered when the user edits it in Settings via config:set.
  try {
    const cfg = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
    setPlayShortcut(cfg.playShortcut)
  } catch (err) {
    console.warn('[main] could not load config for shortcut registration', err)
  }

  const win = createOperatorWindow()
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[main] operator did-fail-load ${code} ${desc} ${url}`)
  })
  if (process.env.ELECTRON_RENDERER_URL) {
    await win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/apps/operator/`)
  } else {
    await win.loadFile(join(__dirname, '../renderer/apps/operator/index.html'))
  }
}

app.whenReady().then(bootstrap)

app.on('will-quit', () => {
  unregisterAllShortcuts()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) bootstrap()
})
