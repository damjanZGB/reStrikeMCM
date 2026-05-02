import type { NamesMode, PlayoutPhase, PlayoutInstruction, Rank, PodiumHeights } from '@restrike-mcm/shared'

/** Banner stack is visible whenever banners are physically on screen. */
export function isBannerVisible(phase: PlayoutPhase): boolean {
  return phase === 'rising' || phase === 'holding' || phase === 'fading-out' || phase === 'ended'
}

/** When to show the name tag under a banner — depends on the chosen namesMode + phase. */
export function shouldShowNames(namesMode: NamesMode, phase: PlayoutPhase): boolean {
  if (namesMode === 'fixed') return true
  if (namesMode === 'fade-in') return phase === 'holding'
  if (namesMode === 'title-card') {
    return phase === 'title-card' || phase === 'holding' || phase === 'fading-out' || phase === 'ended'
  }
  return false
}

/** Slot height for a given rank, expressed as fraction of stage height (0..1). */
export function targetFractionFor(rank: Rank, podium: PodiumHeights): number {
  if (rank === 'gold')   return podium.goldHeightPct / 100
  if (rank === 'silver') return podium.silverHeightPct / 100
  return podium.bronzeHeightPct / 100
}

/** Resolve a flag's absolute path by rank. bronze2 is gated upstream by bronzeCount === 2. */
export function flagPathFor(rank: Rank, paths: PlayoutInstruction['resolvedAssets']['flagPaths']): string {
  if (rank === 'gold')    return paths.gold
  if (rank === 'silver')  return paths.silver
  if (rank === 'bronze1') return paths.bronze1
  return paths.bronze2!  // gated upstream by bronzeCount === 2 in orderedRanks
}
