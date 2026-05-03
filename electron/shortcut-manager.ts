import { globalShortcut } from 'electron'
import { getOperatorWindow } from './windows.js'

let registeredShortcut: string | null = null

/**
 * Registers (or re-registers) the global PLAY shortcut. Returns true on
 * success, false if Electron rejected the accelerator (e.g., conflict
 * with another app, malformed string). On failure the previous shortcut
 * is also removed — the caller decides what to do next.
 */
export function setPlayShortcut(accelerator: string): boolean {
  if (registeredShortcut === accelerator) return true
  if (registeredShortcut) {
    globalShortcut.unregister(registeredShortcut)
    registeredShortcut = null
  }
  try {
    const ok = globalShortcut.register(accelerator, () => {
      getOperatorWindow()?.webContents.send('shortcut:play')
    })
    if (ok) {
      registeredShortcut = accelerator
      return true
    }
  } catch (err) {
    console.warn(`[shortcut-manager] register threw for ${accelerator}:`, err)
  }
  console.warn(`[shortcut-manager] failed to register ${accelerator}`)
  return false
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
  registeredShortcut = null
}
