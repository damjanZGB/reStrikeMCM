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

export function createDisplayWindow(): BrowserWindow {
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
  // Fullscreen on a true secondary display; on single-monitor setups, open a 1280×720
  // windowed preview on the primary so the operator can still see both UIs side by side.
  const isFullscreen = !!secondary
  displayWin = new BrowserWindow({
    x: target.bounds.x, y: target.bounds.y,
    width: isFullscreen ? target.bounds.width : 1280,
    height: isFullscreen ? target.bounds.height : 720,
    fullscreen: isFullscreen, frame: !isFullscreen, autoHideMenuBar: true,
    backgroundColor: '#000000',
    title: 'reStrike MCM · Display',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      autoplayPolicy: 'no-user-gesture-required' as const,
    },
  })
  // Clear the ref proactively when the user closes the display window
  // (X-button, OS task-kill, etc.). Otherwise getDisplayWindow() would
  // return a zombie reference until display:reset is invoked.
  displayWin.on('closed', () => {
    displayWin = null
  })
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
