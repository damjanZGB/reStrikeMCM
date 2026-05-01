import type { AppConfig } from './types.js'

export const DEFAULT_FADE_OUT_MS = 1500
export const DEFAULT_TITLE_CARD_MS = 3000
export const DEFAULT_RISE_WINDOW_END = 0.85   // rise completes at 85% of anthem

export const SHIPPED_DEFAULT_CONFIG: AppConfig = {
  version: 1,
  disciplines: ['Kyorugi', 'Poomsae', 'Para-TKD K44', 'Para-TKD P44', 'Freestyle Poomsae', 'Pair Poomsae', 'Team Poomsae', 'Breaking'],
  ageCategories: ['Cadet', 'Junior', 'Senior', 'Master M30+', 'Master M40+', 'Master M50+', 'Youth'],
  genders: ['Men', 'Women', 'Mixed'],
  rankLabels: {
    position: ['1ST', '2ND', '3RD', '3RD'],
    medal:    ['GOLD', 'SILVER', 'BRONZE', 'BRONZE'],
  },
  ceremonyTitleText: 'MEDAL CEREMONY',
  defaultBackground: 'default-backdrop.jpg',
  defaults: {
    riseCurve: 'rise-hold',
    namesMode: 'title-card',
    goldTint: false,
    rankLabelStyle: 'position',
  },
  audio: { fadeOutMs: DEFAULT_FADE_OUT_MS },
  podium: { goldHeightPct: 100, silverHeightPct: 78, bronzeHeightPct: 58 },
}
