import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig, saveConfig } from '../config-store.js'
import { SHIPPED_DEFAULT_CONFIG } from '@restrike-mcm/shared'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mcm-config-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('loadConfig', () => {
  it('creates config.json from default if missing', async () => {
    const defaultPath = join(dir, 'default-config.json')
    const configPath = join(dir, 'config.json')
    await writeFile(defaultPath, JSON.stringify(SHIPPED_DEFAULT_CONFIG))
    const cfg = await loadConfig(configPath, defaultPath)
    expect(cfg.version).toBe(1)
    const written = JSON.parse(await readFile(configPath, 'utf-8'))
    expect(written.version).toBe(1)
  })

  it('loads existing config.json', async () => {
    const configPath = join(dir, 'config.json')
    await writeFile(configPath, JSON.stringify(SHIPPED_DEFAULT_CONFIG))
    const cfg = await loadConfig(configPath, '/nonexistent')
    expect(cfg.disciplines).toContain('Kyorugi')
  })

  it('falls back to in-memory defaults on invalid config and preserves the bad file', async () => {
    const original = '{"version": 1, "disciplines": "not-an-array"}'
    const configPath = join(dir, 'config.json')
    await writeFile(configPath, original)
    const cfg = await loadConfig(configPath, '/nonexistent')
    expect(cfg).toEqual(SHIPPED_DEFAULT_CONFIG)
    // Behavioral guarantee: do NOT overwrite the operator's broken config
    const onDisk = await readFile(configPath, 'utf-8')
    expect(onDisk).toBe(original)
  })
})

describe('saveConfig', () => {
  it('writes config to disk and validates', async () => {
    const configPath = join(dir, 'config.json')
    await saveConfig(configPath, SHIPPED_DEFAULT_CONFIG)
    const written = JSON.parse(await readFile(configPath, 'utf-8'))
    expect(written.version).toBe(1)
  })

  it('throws on invalid config (does NOT write)', async () => {
    const configPath = join(dir, 'config.json')
    const bad = { ...SHIPPED_DEFAULT_CONFIG, audio: { fadeOutMs: -1 } }
    await expect(saveConfig(configPath, bad as any)).rejects.toThrow()
  })
})

describe('round-trip of new transparency/backdrop fields', () => {
  it('persists explicit values to disk and loads them back', async () => {
    const configPath = join(dir, 'config.json')
    const cfg = { ...SHIPPED_DEFAULT_CONFIG, transparentBackground: true, backdropEnabled: false }
    await saveConfig(configPath, cfg)
    const loaded = await loadConfig(configPath, '/nonexistent')
    expect(loaded.transparentBackground).toBe(true)
    expect(loaded.backdropEnabled).toBe(false)
  })

  it('fills defaults when loading a legacy config missing both fields', async () => {
    const configPath = join(dir, 'config.json')
    const { transparentBackground: _t, backdropEnabled: _b, ...legacy } = SHIPPED_DEFAULT_CONFIG
    await writeFile(configPath, JSON.stringify(legacy))
    const loaded = await loadConfig(configPath, '/nonexistent')
    expect(loaded.transparentBackground).toBe(false)
    expect(loaded.backdropEnabled).toBe(true)
  })
})
