import type { RiseCurve } from '@restrike-mcm/shared'
import { applyEasing } from './easing.js'

const RISE_HOLD_END = 0.85

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))

/**
 * Rise progress (0..1) at normalized time t.
 *
 * All banners share the same progress curve — they rise simultaneously.
 * Per-rank final height is applied separately by the renderer
 * (via config.podium.{gold,silver,bronze}HeightPct).
 */
export function riseProgress(curve: RiseCurve, t: number): number {
  const x = clamp01(t)
  if (curve === 'linear') return x
  // rise-hold: rise eased to t=0.85, then hold at top
  if (x >= RISE_HOLD_END) return 1
  return applyEasing('easeOutCubic', x / RISE_HOLD_END)
}
