import { describe, it, expect } from 'vitest'
import { applyEasing } from '../easing.js'

describe('applyEasing', () => {
  it('linear: 0→0, 0.5→0.5, 1→1', () => {
    expect(applyEasing('linear', 0)).toBe(0)
    expect(applyEasing('linear', 0.5)).toBe(0.5)
    expect(applyEasing('linear', 1)).toBe(1)
  })

  it('easeOutCubic: 0→0, 1→1, monotonic, decelerates', () => {
    expect(applyEasing('easeOutCubic', 0)).toBe(0)
    expect(applyEasing('easeOutCubic', 1)).toBe(1)
    const a = applyEasing('easeOutCubic', 0.25)
    const b = applyEasing('easeOutCubic', 0.5)
    const c = applyEasing('easeOutCubic', 0.75)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
    // deceleration: bigger jump in first half than second half
    expect(b - 0).toBeGreaterThan(1 - c)
  })

  it('easeInOutCubic: 0→0, 1→1, 0.5→0.5 symmetric', () => {
    expect(applyEasing('easeInOutCubic', 0)).toBe(0)
    expect(applyEasing('easeInOutCubic', 1)).toBe(1)
    expect(applyEasing('easeInOutCubic', 0.5)).toBeCloseTo(0.5, 6)
  })

  it('clamps inputs outside [0,1]', () => {
    expect(applyEasing('linear', -0.5)).toBe(0)
    expect(applyEasing('linear', 1.5)).toBe(1)
  })
})
