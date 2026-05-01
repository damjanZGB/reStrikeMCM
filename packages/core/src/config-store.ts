import { readFile, writeFile, copyFile, access } from 'node:fs/promises'
import { AppConfigSchema, SHIPPED_DEFAULT_CONFIG, type AppConfig } from '@restrike-mcm/shared'

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true } catch { return false }
}

export async function loadConfig(configPath: string, defaultConfigPath: string): Promise<AppConfig> {
  if (!(await exists(configPath))) {
    if (await exists(defaultConfigPath)) {
      await copyFile(defaultConfigPath, configPath)
    } else {
      await writeFile(configPath, JSON.stringify(SHIPPED_DEFAULT_CONFIG, null, 2))
    }
  }
  try {
    const raw = await readFile(configPath, 'utf-8')
    return AppConfigSchema.parse(JSON.parse(raw))
  } catch (err) {
    console.warn('[config-store] config invalid, using shipped defaults:', err)
    return SHIPPED_DEFAULT_CONFIG
  }
}

export async function saveConfig(configPath: string, config: AppConfig): Promise<void> {
  const validated = AppConfigSchema.parse(config)
  await writeFile(configPath, JSON.stringify(validated, null, 2))
}
