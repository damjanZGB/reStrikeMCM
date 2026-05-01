import { dirname, join } from 'node:path'

export function getAppRoot(execPath: string, isDev: boolean, devProjectRoot?: string): string {
  return isDev && devProjectRoot ? devProjectRoot : dirname(execPath)
}

export function getAssetsRoot(appRoot: string): string {
  return join(appRoot, 'assets')
}

export function getSessionsRoot(appRoot: string): string {
  return join(appRoot, 'sessions')
}

export function getConfigPath(appRoot: string): string {
  return join(appRoot, 'config.json')
}

export function getDefaultConfigPath(appRoot: string): string {
  return join(appRoot, 'default-config.json')
}
