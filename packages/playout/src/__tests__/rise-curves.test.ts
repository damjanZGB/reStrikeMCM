import { describe, it, expect } from 'vitest'
import { riseProgress } from '../rise-curves.js'

describe('riseProgress', () => {
  describe('linear curve', () => {
    it('linear: 0→0, 0.5→0.5, 1→1', () => {
      expect(riseProgress('linear', 0)).toBe(0)
      expect(riseProgress('linear', 0.5)).toBeCloseTo(0.5, 5)
      expect(riseProgress('linear', 1)).toBe(1)
    })
  })

  describe('rise-hold curve', () => {
    it('rises eased to t=0.85 then holds at 1', () => {
      expect(riseProgress('rise-hold', 0)).toBe(0)
      expect(riseProgress('rise-hold', 0.85)).toBeCloseTo(1, 5)
      expect(riseProgress('rise-hold', 1)).toBe(1)
      const mid = riseProgress('rise-hold', 0.5)
      expect(mid).toBeGreaterThan(0)
      expect(mid).toBeLessThan(1)
    })

    it('reaches 1 before t=1 (no movement after 0.85)', () => {
      const at90 = riseProgress('rise-hold', 0.9)
      const at100 = riseProgress('rise-hold', 1)
      expect(at90).toBe(at100)
      expect(at90).toBe(1)
    })

    it('rise-hold mid-rise is faster than linear (eased)', () => {
      // easeOutCubic at 0.5/0.85 ≈ easeOutCubic(0.588) = 1 - (1-0.588)^3 ≈ 0.930
      // linear at 0.5/0.85 = 0.588
      // so rise-hold should be ahead of linear at mid-rise
      const riseHoldMid = riseProgress('rise-hold', 0.5)
      const linearMid = riseProgress('linear', 0.5)
      expect(riseHoldMid).toBeGreaterThan(linearMid)
    })
  })

  it('clamps inputs outside [0,1]', () => {
    expect(riseProgress('linear', -0.5)).toBe(0)
    expect(riseProgress('linear', 1.5)).toBe(1)
    expect(riseProgress('rise-hold', -0.1)).toBe(0)
    expect(riseProgress('rise-hold', 1.5)).toBe(1)
  })
})
