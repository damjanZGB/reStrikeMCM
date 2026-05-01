import type { Easing } from '@restrike-mcm/shared'

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))

export function applyEasing(kind: Easing, t: number): number {
  const x = clamp01(t)
  switch (kind) {
    case 'linear':
      return x
    case 'easeOutCubic':
      return 1 - Math.pow(1 - x, 3)
    case 'easeInOutCubic':
      return x < 0.5
        ? 4 * x * x * x
        : 1 - Math.pow(-2 * x + 2, 3) / 2
  }
}
