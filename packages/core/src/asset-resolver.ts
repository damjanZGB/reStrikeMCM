import { join } from 'node:path'
import { access } from 'node:fs/promises'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

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
