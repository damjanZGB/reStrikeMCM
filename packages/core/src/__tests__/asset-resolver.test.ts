import { describe, it, expect } from 'vitest'
import { resolveAnthemFor, resolveFlagFor } from '../asset-resolver.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe('resolveAnthemFor', () => {
  it('returns absolute path when MP3 exists', async () => {
    const p = await resolveAnthemFor('UZB', FIXTURES)
    expect(p).toBe(join(FIXTURES, 'anthems', 'UZB.mp3'))
  })

  it('returns null when MP3 missing', async () => {
    const p = await resolveAnthemFor('XYZ', FIXTURES)
    expect(p).toBeNull()
  })

  it('uppercases the NOC before lookup', async () => {
    const p = await resolveAnthemFor('uzb', FIXTURES)
    expect(p).toBe(join(FIXTURES, 'anthems', 'UZB.mp3'))
  })

  it('returns null for empty NOC', async () => {
    const p = await resolveAnthemFor('', FIXTURES)
    expect(p).toBeNull()
  })
})

describe('resolveFlagFor', () => {
  it('returns absolute path when JSON exists', async () => {
    const p = await resolveFlagFor('UZB', FIXTURES)
    expect(p).toBe(join(FIXTURES, 'flag_animations', 'UZB.json'))
  })

  it('returns null when JSON missing', async () => {
    const p = await resolveFlagFor('XYZ', FIXTURES)
    expect(p).toBeNull()
  })
})
