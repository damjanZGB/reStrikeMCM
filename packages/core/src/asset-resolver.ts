import { join } from 'node:path'
import { exists } from './fs-helpers.js'

export async function resolveAnthemFor(noc: string, assetsRoot: string): Promise<string | null> {
  const code = noc.trim().toUpperCase()
  if (!code) return null
  const path = join(assetsRoot, 'anthems', `${code}.mp3`)
  return (await exists(path)) ? path : null
}

export async function resolveFlagFor(noc: string, assetsRoot: string): Promise<string | null> {
  const code = noc.trim().toUpperCase()
  if (!code) return null
  const path = join(assetsRoot, 'flag_animations', `${code}.json`)
  return (await exists(path)) ? path : null
}
