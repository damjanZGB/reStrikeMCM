import { app } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { getAppRoot, getAssetsRoot, getSessionsRoot, getConfigPath, getDefaultConfigPath } from '@restrike-mcm/core'

const isDev = !app.isPackaged
const PROJECT_ROOT = isDev ? resolve(dirname(fileURLToPath(import.meta.url)), '..') : ''

// APP_ROOT — where the executable + read-only bundled content lives.
export const APP_ROOT = getAppRoot(process.execPath, isDev, PROJECT_ROOT)
export const ASSETS_ROOT = getAssetsRoot(APP_ROOT)
export const DEFAULT_CONFIG_PATH = isDev
  ? join(PROJECT_ROOT, 'default-config.json')
  : getDefaultConfigPath(APP_ROOT)

// USER_DATA_ROOT — where user-mutable state lives. Persists across rebuilds
// and upgrades; %APPDATA%/reStrikeMCM/ on Windows.
const USER_DATA_ROOT = app.getPath('userData')
export const SESSIONS_ROOT = getSessionsRoot(USER_DATA_ROOT)
export const CONFIG_PATH = getConfigPath(USER_DATA_ROOT)
