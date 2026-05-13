import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let operatorWin: BrowserWindow | null = null
let displayWin: BrowserWindow | null = null

export function createOperatorWindow(): BrowserWindow {
  operatorWin = new BrowserWindow({
    width: 1280, height: 800, show: false, autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  operatorWin.on('ready-to-show', () => operatorWin?.show())
  operatorWin.webContents.openDevTools({ mode: 'detach' })  // TEMP for debugging — remove after validation
  return operatorWin
}

export function createDisplayWindow(opts: { transparent: boolean } = { transparent: false }): BrowserWindow {
  // Idempotent: if a display window is already open, reuse it instead of
  // creating a second one (multi-instance display would steal focus,
  // duplicate IPC subscriptions, and leak the previous window).
  if (displayWin && !displayWin.isDestroyed()) {
    return displayWin
  }
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const secondary = displays.find(d => d.id !== primary.id)
  const target = secondary ?? primary
  const isSecondary = !!secondary
  const transparent = opts.transparent

  // Transparent windows on Windows can't reliably use fullscreen + DWM compositing.
  // Use a frameless borderless window sized to the display bounds instead.
  const fullscreen = !transparent && isSecondary
  const frame = !transparent && !isSecondary
  const width  = (transparent || isSecondary) ? target.bounds.width  : 1280
  const height = (transparent || isSecondary) ? target.bounds.height : 720

  displayWin = new BrowserWindow({
    x: target.bounds.x, y: target.bounds.y,
    width, height,
    fullscreen,
    frame,
    transparent,
    hasShadow: !transparent,
    backgroundColor: transparent ? '#00000000' : '#000000',
    autoHideMenuBar: true,
    title: 'reStrike MCM · Display',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      autoplayPolicy: 'no-user-gesture-required' as const,
    },
  })

  if (transparent && !isSecondary) {
    // Borderless + primary monitor: stay on top so OBS can find it and the user
    // can see it. Operator UI can toggle this off via 'display:set-always-on-top'.
    displayWin.setAlwaysOnTop(true, 'screen-saver')
  }

  // Clear the ref proactively when the user closes the display window
  // (X-button, OS task-kill, etc.). Otherwise getDisplayWindow() would
  // return a zombie reference until display:reset is invoked.
  displayWin.on('closed', () => { displayWin = null })
  displayWin.webContents.openDevTools({ mode: 'detach' })  // TEMP debug
  return displayWin
}

export function getOperatorWindow() { return operatorWin }
/** Returns the live display window, or null if it doesn't exist or was destroyed. */
export function getDisplayWindow(): BrowserWindow | null {
  return displayWin && !displayWin.isDestroyed() ? displayWin : null
}
export function closeDisplayWindow() {
  if (displayWin && !displayWin.isDestroyed()) displayWin.close()
  displayWin = null
}

/** Load the display app's renderer (dev URL or packaged file). Returns when DOM is loaded. */
export async function loadDisplayContent(win: BrowserWindow): Promise<void> {
  if (process.env.ELECTRON_RENDERER_URL) {
    await win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/apps/display/`)
  } else {
    await win.loadFile(join(__dirname, '../renderer/apps/display/index.html'))
  }
}
