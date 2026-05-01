import { describe, it, expect } from 'vitest'
import { AppConfigSchema, CeremonySchema, AthleteSchema } from '../schemas.js'
import { SHIPPED_DEFAULT_CONFIG } from '../constants.js'

describe('AppConfigSchema', () => {
  it('accepts the shipped default config', () => {
    expect(() => AppConfigSchema.parse(SHIPPED_DEFAULT_CONFIG)).not.toThrow()
  })

  it('rejects negative fadeOutMs', () => {
    const bad = { ...SHIPPED_DEFAULT_CONFIG, audio: { fadeOutMs: -1 } }
    expect(() => AppConfigSchema.parse(bad)).toThrow()
  })

  it('rejects podium height above 100', () => {
    const bad = { ...SHIPPED_DEFAULT_CONFIG, podium: { ...SHIPPED_DEFAULT_CONFIG.podium, goldHeightPct: 110 } }
    expect(() => AppConfigSchema.parse(bad)).toThrow()
  })
})

describe('AthleteSchema', () => {
  it('accepts a valid 3-letter NOC', () => {
    const ok = { rank: 'gold', name: 'X', noc: 'UZB', status: 'ready' } as const
    expect(() => AthleteSchema.parse(ok)).not.toThrow()
  })

  it('rejects lowercase NOC', () => {
    const bad = { rank: 'gold', name: 'X', noc: 'uzb', status: 'ready' } as const
    expect(() => AthleteSchema.parse(bad)).toThrow()
  })

  it('accepts empty NOC (entry not yet started)', () => {
    const ok = { rank: 'gold', name: '', noc: '', status: 'empty' } as const
    expect(() => AthleteSchema.parse(ok)).not.toThrow()
  })
})

describe('CeremonySchema', () => {
  it('rejects ceremony with fewer than 3 athletes', () => {
    const c = {
      id: '00000000-0000-4000-8000-000000000000',
      category: 'X', ageCategory: 'Senior', discipline: 'Kyorugi', gender: 'M',
      bronzeCount: 2,
      athletes: [{ rank: 'gold', name: 'A', noc: 'USA', status: 'ready' }],
      display: { rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card', goldTint: false },
      status: 'pending',
    }
    expect(() => CeremonySchema.parse(c)).toThrow()
  })
})
