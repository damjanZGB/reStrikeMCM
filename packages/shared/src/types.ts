export type Rank = 'gold' | 'silver' | 'bronze1' | 'bronze2'
export type RankPosition = 1 | 2 | 3
export type Gender = 'M' | 'F' | 'X'
export type RiseCurve = 'linear' | 'rise-hold'
export type NamesMode = 'fixed' | 'fade-in' | 'title-card'
export type RankLabelStyle = 'position' | 'medal' | 'custom'
export type AthleteStatus = 'empty' | 'pending' | 'ready'
export type CeremonyStatus = 'empty' | 'pending' | 'ready' | 'played'
export type Easing = 'linear' | 'easeOutCubic' | 'easeInOutCubic'

export interface Athlete {
  rank: Rank
  name: string
  noc: string
  status: AthleteStatus
  anthemOverride?: string | undefined
  flagOverride?: string | undefined
}

export interface CeremonyDisplayOptions {
  rankLabelStyle: RankLabelStyle
  riseCurve: RiseCurve
  namesMode: NamesMode
  goldTint: boolean
  backgroundOverride?: string | undefined
}

export interface Ceremony {
  id: string
  category: string
  ageCategory: string
  discipline: string
  gender: Gender
  bronzeCount: 1 | 2
  athletes: Athlete[]
  display: CeremonyDisplayOptions
  status: CeremonyStatus
  playedAt?: string | undefined
}

export interface Session {
  id: string
  label: string
  createdAt: string
  updatedAt: string
  ceremonies: Ceremony[]
}

export interface RankLabels {
  position: [string, string, string, string]
  medal: [string, string, string, string]
  custom?: [string, string, string, string] | undefined
}

export interface PodiumHeights {
  goldHeightPct: number
  silverHeightPct: number
  bronzeHeightPct: number
}

export interface AppConfig {
  version: 1
  disciplines: string[]
  ageCategories: string[]
  genders: string[]
  rankLabels: RankLabels
  ceremonyTitleText: string
  defaultBackground: string
  defaults: {
    riseCurve: RiseCurve
    namesMode: NamesMode
    goldTint: boolean
    rankLabelStyle: RankLabelStyle
  }
  audio: { fadeOutMs: number }
  podium: PodiumHeights
}

export interface PlayoutInstruction {
  ceremony: Ceremony
  resolvedAssets: {
    anthemPath: string
    flagPaths: { gold: string; silver: string; bronze1: string; bronze2?: string | undefined }
    backgroundPath: string
  }
  anthemDurationMs: number
  config: Pick<AppConfig, 'rankLabels' | 'ceremonyTitleText' | 'audio' | 'podium'>
}

export type PlayoutPhase = 'idle' | 'title-card' | 'rising' | 'holding' | 'fading-out' | 'ended'
