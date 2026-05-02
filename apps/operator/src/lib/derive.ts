import type { Athlete, Ceremony, CeremonyStatus } from '@restrike-mcm/shared'

/**
 * Derive a ceremony's aggregate status from its athletes' statuses.
 * `'played'` is terminal — once set, it stays set even if athletes change.
 */
export function deriveCeremonyStatus(prev: CeremonyStatus, athletes: Athlete[]): CeremonyStatus {
  if (prev === 'played') return 'played'
  if (athletes.every(a => a.status === 'ready')) return 'ready'
  if (athletes.some(a => a.status !== 'empty')) return 'pending'
  return 'empty'
}

interface Resolution { anthemPath: string | null; flagPath: string | null }
interface Overrides {
  anthemOverride?: string | null | undefined
  flagOverride?: string | null | undefined
}

/**
 * Athlete is ready iff both anthem and flag are available — either resolved from
 * NOC or supplied as an override. Equivalent to: `(a∨A) ∧ (f∨F)`.
 */
export function isAthleteReady(resolution: Resolution, overrides: Overrides): boolean {
  const hasAnthem = !!resolution.anthemPath || !!overrides.anthemOverride
  const hasFlag = !!resolution.flagPath || !!overrides.flagOverride
  return hasAnthem && hasFlag
}

/** Convenience: derive an updated Ceremony from an existing one with new athletes. */
export function updatedCeremony(c: Ceremony, athletes: Athlete[]): Ceremony {
  return { ...c, athletes, status: deriveCeremonyStatus(c.status, athletes) }
}
