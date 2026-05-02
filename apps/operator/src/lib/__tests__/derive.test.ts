import { describe, it, expect } from 'vitest'
import type { Athlete } from '@restrike-mcm/shared'
import { deriveCeremonyStatus, isAthleteReady, updatedCeremony } from '../derive.js'

const a = (status: Athlete['status']): Athlete => ({ rank: 'gold', name: '', noc: '', status })

describe('deriveCeremonyStatus', () => {
  it('returns played terminally regardless of athletes', () => {
    expect(deriveCeremonyStatus('played', [a('empty'), a('empty')])).toBe('played')
    expect(deriveCeremonyStatus('played', [a('ready'), a('ready')])).toBe('played')
  })

  it('returns empty when all athletes are empty', () => {
    expect(deriveCeremonyStatus('empty', [a('empty'), a('empty'), a('empty')])).toBe('empty')
  })

  it('returns ready when every athlete is ready', () => {
    expect(deriveCeremonyStatus('pending', [a('ready'), a('ready'), a('ready')])).toBe('ready')
  })

  it('returns pending when some are not empty but not all ready', () => {
    expect(deriveCeremonyStatus('empty', [a('ready'), a('pending'), a('empty')])).toBe('pending')
    expect(deriveCeremonyStatus('empty', [a('pending'), a('empty'), a('empty')])).toBe('pending')
  })

  it('handles a single athlete', () => {
    expect(deriveCeremonyStatus('empty', [a('empty')])).toBe('empty')
    expect(deriveCeremonyStatus('empty', [a('ready')])).toBe('ready')
    expect(deriveCeremonyStatus('empty', [a('pending')])).toBe('pending')
  })
})

describe('isAthleteReady', () => {
  const both = { anthemPath: '/u.mp3', flagPath: '/u.json' }
  const onlyAnthem = { anthemPath: '/u.mp3', flagPath: null }
  const onlyFlag = { anthemPath: null, flagPath: '/u.json' }
  const neither = { anthemPath: null, flagPath: null }

  it('is ready when both resolve from NOC', () => {
    expect(isAthleteReady(both, {})).toBe(true)
  })

  it('is ready when both come from overrides', () => {
    expect(isAthleteReady(neither, { anthemOverride: '/x.mp3', flagOverride: '/x.json' })).toBe(true)
  })

  it('is ready when one resolves and the other is an override (mix)', () => {
    expect(isAthleteReady(onlyAnthem, { flagOverride: '/x.json' })).toBe(true)
    expect(isAthleteReady(onlyFlag, { anthemOverride: '/x.mp3' })).toBe(true)
  })

  it('is not ready when one is missing entirely', () => {
    expect(isAthleteReady(onlyAnthem, {})).toBe(false)
    expect(isAthleteReady(onlyFlag, {})).toBe(false)
    expect(isAthleteReady(neither, {})).toBe(false)
    expect(isAthleteReady(neither, { anthemOverride: '/x.mp3' })).toBe(false)
    expect(isAthleteReady(neither, { flagOverride: '/x.json' })).toBe(false)
  })

  it('treats empty-string overrides as missing', () => {
    expect(isAthleteReady(neither, { anthemOverride: '', flagOverride: '' })).toBe(false)
  })
})

describe('updatedCeremony', () => {
  const baseAthletes: Athlete[] = [
    { rank: 'gold',    name: 'A', noc: 'AAA', status: 'empty' },
    { rank: 'silver',  name: 'B', noc: 'BBB', status: 'empty' },
    { rank: 'bronze1', name: 'C', noc: 'CCC', status: 'empty' },
  ]
  const base = {
    id: 'x', category: 'M', ageCategory: 'Senior', discipline: 'Kyorugi',
    gender: 'M' as const, bronzeCount: 1 as const, athletes: baseAthletes,
    display: { rankLabelStyle: 'position' as const, riseCurve: 'rise-hold' as const, namesMode: 'title-card' as const, goldTint: false, textsEnabled: true },
    status: 'empty' as const,
  }

  it('preserves identity but recomputes status from updated athletes', () => {
    const next = updatedCeremony(base, baseAthletes.map(x => ({ ...x, status: 'ready' as const })))
    expect(next.id).toBe('x')
    expect(next.status).toBe('ready')
    expect(next.athletes).not.toBe(baseAthletes)  // new array
  })

  it('keeps played status across re-derivation', () => {
    const played = { ...base, status: 'played' as const }
    const next = updatedCeremony(played, baseAthletes)
    expect(next.status).toBe('played')
  })
})
