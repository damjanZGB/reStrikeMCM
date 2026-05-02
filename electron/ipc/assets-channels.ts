import { ipcMain } from 'electron'
import { resolveAnthemFor, resolveFlagFor, readMp3Duration } from '@restrike-mcm/core'
import { ASSETS_ROOT } from '../paths.js'

export function registerAssetsChannels() {
  ipcMain.handle('assets:resolve-noc', async (_e, noc: string) => {
    const [anthemPath, flagPath] = await Promise.all([
      resolveAnthemFor(noc, ASSETS_ROOT),
      resolveFlagFor(noc, ASSETS_ROOT),
    ])
    return { anthemPath, flagPath }
  })
  ipcMain.handle('assets:audio-duration', async (_e, path: string) => {
    const durationMs = await readMp3Duration(path)
    return { durationMs }
  })
}
