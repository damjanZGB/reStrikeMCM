import { describe, it, expect } from 'vitest'
import type { PlayoutPhase, NamesMode } from '@restrike-mcm/shared'
import { isBannerVisible, shouldShowNames, targetFractionFor, flagPathFor } from '../playout-helpers.js'

describe('isBannerVisible', () => {
  it('hides during idle and title-card', () => {
    expect(isBannerVisible('idle')).toBe(false)
    expect(isBannerVisible('title-card')).toBe(false)
  })

  it('shows from rising through flag-fade', () => {
    expect(isBannerVisible('rising')).toBe(true)
    expect(isBannerVisible('holding')).toBe(true)
    expect(isBannerVisible('fading-out')).toBe(true)
    expect(isBannerVisible('ended')).toBe(true)
    expect(isBannerVisible('flag-fade')).toBe(true)
  })
})

describe('shouldShowNames', () => {
  const phases: PlayoutPhase[] = ['idle', 'title-card', 'rising', 'holding', 'fading-out', 'ended']

  it('fixed: always true once banners visible', () => {
    for (const p of phases) expect(shouldShowNames('fixed', p)).toBe(true)
  })

  it('fade-in: only during holding', () => {
    for (const p of phases) {
      expect(shouldShowNames('fade-in', p)).toBe(p === 'holding')
    }
  })

  it('title-card: visible during title-card and from holding onward', () => {
    expect(shouldShowNames('title-card', 'idle')).toBe(false)
    expect(shouldShowNames('title-card', 'rising')).toBe(false)
    expect(shouldShowNames('title-card', 'title-card')).toBe(true)
    expect(shouldShowNames('title-card', 'holding')).toBe(true)
    expect(shouldShowNames('title-card', 'fading-out')).toBe(true)
    expect(shouldShowNames('title-card', 'ended')).toBe(true)
  })
})

describe('targetFractionFor', () => {
  const podium = { goldHeightPct: 100, silverHeightPct: 78, bronzeHeightPct: 58 }

  it('returns gold/silver/bronze fractions', () => {
    expect(targetFractionFor('gold', podium)).toBeCloseTo(1.0)
    expect(targetFractionFor('silver', podium)).toBeCloseTo(0.78)
    expect(targetFractionFor('bronze1', podium)).toBeCloseTo(0.58)
    expect(targetFractionFor('bronze2', podium)).toBeCloseTo(0.58)
  })
})

describe('flagPathFor', () => {
  const paths = { gold: '/g.json', silver: '/s.json', bronze1: '/b1.json' }

  it('looks up the three required ranks', () => {
    expect(flagPathFor('gold', paths)).toBe('/g.json')
    expect(flagPathFor('silver', paths)).toBe('/s.json')
    expect(flagPathFor('bronze1', paths)).toBe('/b1.json')
  })

  it('returns bronze2 when present', () => {
    expect(flagPathFor('bronze2', { ...paths, bronze2: '/b2.json' })).toBe('/b2.json')
  })
})
