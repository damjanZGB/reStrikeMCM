import type { AppConfig, CeremonyTitle } from './types.js'

export const DEFAULT_FADE_OUT_MS = 1500
export const DEFAULT_TITLE_CARD_MS = 3000
export const DEFAULT_RISE_WINDOW_END = 0.85   // rise completes at 85% of anthem

export const DEFAULT_TITLE: CeremonyTitle = {
  text: 'MEDAL CEREMONY',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 2.5,
  fontWeight: 700,
  letterSpacing: 0,
  color: '#ffd700',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
  animation: 'fade-in',
  textAlign: 'center',
  verticalAlign: 'top',
  x: 50,
  y: 14,
}

export const SHIPPED_DEFAULT_CONFIG: AppConfig = {
  version: 1,
  disciplines: ['Kyorugi', 'Poomsae', 'Para-TKD K44', 'Para-TKD P44', 'Freestyle Poomsae', 'Pair Poomsae', 'Team Poomsae', 'Breaking'],
  ageCategories: ['Cadet', 'Junior', 'Senior', 'Master M30+', 'Master M40+', 'Master M50+', 'Youth'],
  genders: ['Men', 'Women', 'Mixed'],
  rankLabels: {
    position: ['1ST', '2ND', '3RD', '3RD'],
    medal:    ['GOLD', 'SILVER', 'BRONZE', 'BRONZE'],
  },
  title: DEFAULT_TITLE,
  defaultBackground: 'default-backdrop.jpg',
  defaults: {
    riseCurve: 'rise-hold',
    namesMode: 'title-card',
    goldTint: false,
    rankLabelStyle: 'position',
  },
  transparentBackground: false,
  backdropEnabled: true,
  audio: { fadeOutMs: DEFAULT_FADE_OUT_MS },
  podium: { goldHeightPct: 88, silverHeightPct: 78, bronzeHeightPct: 68 },
  flagHoldMs: 5000,
  playShortcut: 'Control+Alt+P',
}
