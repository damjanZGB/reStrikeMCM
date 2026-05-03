import { z } from 'zod'

export const RankSchema = z.enum(['gold', 'silver', 'bronze1', 'bronze2'])
export const GenderSchema = z.enum(['M', 'F', 'X'])
export const RiseCurveSchema = z.enum(['linear', 'rise-hold'])
export const NamesModeSchema = z.enum(['fixed', 'fade-in', 'title-card'])
export const RankLabelStyleSchema = z.enum(['position', 'medal', 'custom'])
export const AthleteStatusSchema = z.enum(['empty', 'pending', 'ready'])
export const CeremonyStatusSchema = z.enum(['empty', 'pending', 'ready', 'played'])
export const EasingSchema = z.enum(['linear', 'easeOutCubic', 'easeInOutCubic'])
export const TitleAnimationSchema = z.enum(['none', 'fade-in', 'pulse', 'glow', 'slide-down', 'zoom'])
export const HorizontalAlignSchema = z.enum(['left', 'center', 'right'])
export const VerticalAlignSchema = z.enum(['top', 'middle', 'bottom'])

export const CeremonyTitleSchema = z.object({
  text: z.string(),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(0.5).max(20),
  fontWeight: z.number().int().min(100).max(900),
  letterSpacing: z.number().min(-1).max(2),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #rrggbb'),
  textShadow: z.string(),
  animation: TitleAnimationSchema,
  textAlign: HorizontalAlignSchema,
  verticalAlign: VerticalAlignSchema,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

export const AthleteSchema = z.object({
  rank: RankSchema,
  name: z.string(),
  noc: z.string().regex(/^[A-Z]{0,3}$/, 'NOC must be 0–3 uppercase letters'),
  status: AthleteStatusSchema,
  anthemOverride: z.string().optional(),
  flagOverride: z.string().optional(),
})

export const CeremonyDisplayOptionsSchema = z.object({
  rankLabelStyle: RankLabelStyleSchema,
  riseCurve: RiseCurveSchema,
  namesMode: NamesModeSchema,
  goldTint: z.boolean(),
  textsEnabled: z.boolean().default(true),
  backgroundOverride: z.string().optional(),
})

export const CeremonySchema = z.object({
  id: z.string().uuid(),
  category: z.string(),
  ageCategory: z.string(),
  discipline: z.string(),
  gender: GenderSchema,
  bronzeCount: z.union([z.literal(1), z.literal(2)]),
  athletes: z.array(AthleteSchema).min(3).max(4),
  display: CeremonyDisplayOptionsSchema,
  status: CeremonyStatusSchema,
  playedAt: z.string().datetime().optional(),
})

export const SessionSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  ceremonies: z.array(CeremonySchema),
})

const FourStrings = z.tuple([z.string(), z.string(), z.string(), z.string()])

export const AppConfigSchema = z.object({
  version: z.literal(1),
  disciplines: z.array(z.string()).min(1),
  ageCategories: z.array(z.string()).min(1),
  genders: z.array(z.string()).min(1),
  rankLabels: z.object({
    position: FourStrings,
    medal: FourStrings,
    custom: FourStrings.optional(),
  }),
  title: CeremonyTitleSchema,
  defaultBackground: z.string(),
  defaultBackgroundCustomPath: z.string().optional(),
  defaults: z.object({
    riseCurve: RiseCurveSchema,
    namesMode: NamesModeSchema,
    goldTint: z.boolean(),
    rankLabelStyle: RankLabelStyleSchema,
  }),
  audio: z.object({ fadeOutMs: z.number().min(0).max(5000) }),
  podium: z.object({
    goldHeightPct: z.number().min(30).max(100),
    silverHeightPct: z.number().min(30).max(100),
    bronzeHeightPct: z.number().min(30).max(100),
  }),
  flagHoldMs: z.number().min(0).max(60000).default(5000),
  playShortcut: z.string().min(1).default('Control+Alt+P'),
})
