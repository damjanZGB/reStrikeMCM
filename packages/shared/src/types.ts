export type Rank = 'gold' | 'silver' | 'bronze1' | 'bronze2'
export type RankPosition = 1 | 2 | 3
export type Gender = 'M' | 'F' | 'X'
export type RiseCurve = 'linear' | 'rise-hold'
export type NamesMode = 'fixed' | 'fade-in' | 'title-card'
export type RankLabelStyle = 'position' | 'medal' | 'custom'
export type AthleteStatus = 'empty' | 'pending' | 'ready'
export type CeremonyStatus = 'empty' | 'pending' | 'ready' | 'played'
export type Easing = 'linear' | 'easeOutCubic' | 'easeInOutCubic'
export type TitleAnimation = 'none' | 'fade-in' | 'pulse' | 'glow' | 'slide-down' | 'zoom'
export type HorizontalAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

export interface CeremonyTitle {
  text: string
  fontFamily: string
  fontSize: number          // viewport-width units (vw)
  fontWeight: number        // 100..900
  letterSpacing: number     // em
  color: string             // hex (#rrggbb)
  textShadow: string        // CSS text-shadow value
  animation: TitleAnimation
  textAlign: HorizontalAlign
  verticalAlign: VerticalAlign
  x: number                 // 0..100, percent of viewport width (anchor position)
  y: number                 // 0..100, percent of viewport height (anchor position)
}

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
  textsEnabled: boolean
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
  title: CeremonyTitle
  defaultBackground: string                 // bundled fallback filename (resolved under assets/backgrounds/)
  defaultBackgroundCustomPath?: string | undefined  // user-selected absolute path; overrides bundled default when set
  defaults: {
    riseCurve: RiseCurve
    namesMode: NamesMode
    goldTint: boolean
    rankLabelStyle: RankLabelStyle
  }
  audio: { fadeOutMs: number }
  podium: PodiumHeights
  flagHoldMs: number          // ms flags remain visible after anthem ends, before fading out
  playShortcut: string        // Electron accelerator string for global PLAY hotkey, e.g. "Control+Alt+P"
}

export interface PlayoutInstruction {
  ceremony: Ceremony
  resolvedAssets: {
    anthemPath: string
    flagPaths: { gold: string; silver: string; bronze1: string; bronze2?: string | undefined }
    backgroundPath: string
  }
  anthemDurationMs: number
  config: Pick<AppConfig, 'rankLabels' | 'title' | 'audio' | 'podium' | 'flagHoldMs'>
}

export type PlayoutPhase = 'idle' | 'title-card' | 'rising' | 'holding' | 'fading-out' | 'ended' | 'flag-fade'
