import { app, BrowserWindow } from 'electron'
import { mkdir } from 'node:fs/promises'
import { ASSETS_ROOT, SESSIONS_ROOT } from './paths.js'
import { createOperatorWindow } from './windows.js'
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
  const win = createOperatorWindow()
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/operator/`)
  } else {
    win.loadFile('out/renderer/operator/index.html')
  }
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) bootstrap()
})
