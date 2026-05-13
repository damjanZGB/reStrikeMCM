import { describe, it, expect } from 'vitest'
import { AppConfigSchema, CeremonySchema, AthleteSchema, CeremonyDisplayOptionsSchema } from '../schemas.js'
import type { AppConfig } from '../types.js'
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

  it('rejects empty disciplines or ageCategories arrays', () => {
    expect(() => AppConfigSchema.parse({ ...SHIPPED_DEFAULT_CONFIG, disciplines: [] })).toThrow()
    expect(() => AppConfigSchema.parse({ ...SHIPPED_DEFAULT_CONFIG, ageCategories: [] })).toThrow()
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

  it('accepts partial NOC (mid-typing) — 1 or 2 letters', () => {
    const one = { rank: 'gold', name: '', noc: 'U', status: 'empty' } as const
    const two = { rank: 'gold', name: '', noc: 'UZ', status: 'empty' } as const
    expect(() => AthleteSchema.parse(one)).not.toThrow()
    expect(() => AthleteSchema.parse(two)).not.toThrow()
  })

  it('rejects 4+ letter NOC', () => {
    const bad = { rank: 'gold', name: '', noc: 'UZBE', status: 'empty' } as const
    expect(() => AthleteSchema.parse(bad)).toThrow()
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

describe('AppConfigSchema — transparency & backdrop', () => {
  it('defaults transparentBackground to false when missing', () => {
    const { transparentBackground: _omit, ...without } = SHIPPED_DEFAULT_CONFIG as AppConfig & { transparentBackground?: boolean }
    const parsed = AppConfigSchema.parse(without)
    expect(parsed.transparentBackground).toBe(false)
  })

  it('defaults backdropEnabled to true when missing', () => {
    const { backdropEnabled: _omit, ...without } = SHIPPED_DEFAULT_CONFIG as AppConfig & { backdropEnabled?: boolean }
    const parsed = AppConfigSchema.parse(without)
    expect(parsed.backdropEnabled).toBe(true)
  })

  it('accepts explicit transparentBackground=true', () => {
    const cfg = { ...SHIPPED_DEFAULT_CONFIG, transparentBackground: true }
    expect(() => AppConfigSchema.parse(cfg)).not.toThrow()
  })
})

describe('CeremonyDisplayOptionsSchema — per-ceremony overrides', () => {
  it('accepts undefined for both override fields', () => {
    const d = { rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card', goldTint: false, textsEnabled: true }
    expect(() => CeremonyDisplayOptionsSchema.parse(d)).not.toThrow()
  })

  it('accepts true/false for transparentBackground and backdropEnabled', () => {
    const base = { rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card', goldTint: false, textsEnabled: true }
    expect(() => CeremonyDisplayOptionsSchema.parse({ ...base, transparentBackground: true,  backdropEnabled: false })).not.toThrow()
    expect(() => CeremonyDisplayOptionsSchema.parse({ ...base, transparentBackground: false, backdropEnabled: true  })).not.toThrow()
  })
})
