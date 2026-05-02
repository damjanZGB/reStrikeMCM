import { ipcMain, BrowserWindow } from 'electron'
import { getDisplayWindow, getOperatorWindow } from '../windows.js'
import type { PlayoutInstruction } from '@restrike-mcm/shared'

export function registerCeremonyChannels() {
  ipcMain.handle('ceremony:play', (_e, instruction: PlayoutInstruction) => {
    const display = getDisplayWindow()
    if (!display) throw new Error('Display window is not active. Push to Display 2 first.')
    display.webContents.send('ceremony:play', instruction)
  })

  ipcMain.handle('ceremony:stop', () => {
    const display = getDisplayWindow()
    display?.webContents.send('ceremony:stop')
  })

  // Forward phase-change events from display → operator
  ipcMain.on('ceremony:phase-change', (event, payload) => {
    const operator = getOperatorWindow()
    operator?.webContents.send('ceremony:phase-change', payload)
  })
}
