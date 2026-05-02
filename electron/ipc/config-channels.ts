import { ipcMain } from 'electron'
import { loadConfig, saveConfig } from '@restrike-mcm/core'
import { AppConfigSchema, type AppConfig } from '@restrike-mcm/shared'
import { CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'

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
    return next
  })
}
