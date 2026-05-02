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
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  })
  operatorWin.on('ready-to-show', () => operatorWin?.show())
  return operatorWin
}

export function createDisplayWindow(): BrowserWindow | null {
  const displays = screen.getAllDisplays()
  if (displays.length < 2) {
    return null
  }
  const target = displays.find(d => d.id !== screen.getPrimaryDisplay().id) ?? displays[1]!
  displayWin = new BrowserWindow({
    x: target.bounds.x, y: target.bounds.y,
    width: target.bounds.width, height: target.bounds.height,
    fullscreen: true, frame: false, autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true, nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required' as const,
    },
  })
  return displayWin
}

export function getOperatorWindow() { return operatorWin }
export function getDisplayWindow()  { return displayWin }
export function closeDisplayWindow() {
  displayWin?.close()
  displayWin = null
}
