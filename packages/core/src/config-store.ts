import { readFile, writeFile, copyFile } from 'node:fs/promises'
import { z } from 'zod'
import { AppConfigSchema, SHIPPED_DEFAULT_CONFIG, type AppConfig } from '@restrike-mcm/shared'
import { exists } from './fs-helpers.js'

export async function loadConfig(configPath: string, defaultConfigPath: string): Promise<AppConfig> {
  if (!(await exists(configPath))) {
    if (await exists(defaultConfigPath)) {
      await copyFile(defaultConfigPath, configPath)
    } else {
      await writeFile(configPath, JSON.stringify(SHIPPED_DEFAULT_CONFIG, null, 2))
    }
  }
  // I/O error reading the file — let it propagate (caller decides what to do)
  const raw = await readFile(configPath, 'utf-8')
  try {
    return AppConfigSchema.parse(JSON.parse(raw))
  } catch (err) {
    if (err instanceof SyntaxError || err instanceof z.ZodError) {
      console.warn('[config-store] config invalid, using shipped defaults:', err)
      return SHIPPED_DEFAULT_CONFIG
    }
    throw err
  }
}

export async function saveConfig(configPath: string, config: AppConfig): Promise<void> {
  const validated = AppConfigSchema.parse(config)
  await writeFile(configPath, JSON.stringify(validated, null, 2))
}
