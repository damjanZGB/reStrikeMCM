import { z } from 'zod'

export const RankSchema = z.enum(['gold', 'silver', 'bronze1', 'bronze2'])
export const GenderSchema = z.enum(['M', 'F', 'X'])
export const RiseCurveSchema = z.enum(['linear', 'rise-hold', 'staggered'])
export const NamesModeSchema = z.enum(['fixed', 'fade-in', 'title-card'])
export const RankLabelStyleSchema = z.enum(['position', 'medal', 'custom'])
export const AthleteStatusSchema = z.enum(['empty', 'pending', 'ready'])
export const CeremonyStatusSchema = z.enum(['empty', 'pending', 'ready', 'played'])
export const EasingSchema = z.enum(['linear', 'easeOutCubic', 'easeInOutCubic'])

export const AthleteSchema = z.object({
  rank: RankSchema,
  name: z.string(),
  noc: z.string().regex(/^[A-Z]{3}$|^$/, 'NOC must be empty or 3 uppercase letters'),
  status: AthleteStatusSchema,
  anthemOverride: z.string().optional(),
  flagOverride: z.string().optional(),
})

export const CeremonyDisplayOptionsSchema = z.object({
  rankLabelStyle: RankLabelStyleSchema,
  riseCurve: RiseCurveSchema,
  namesMode: NamesModeSchema,
  goldTint: z.boolean(),
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
  disciplines: z.array(z.string()),
  ageCategories: z.array(z.string()),
  genders: z.array(z.string()).min(1),
  rankLabels: z.object({
    position: FourStrings,
    medal: FourStrings,
    custom: FourStrings.optional(),
  }),
  ceremonyTitleText: z.string().min(1),
  defaultBackground: z.string(),
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
})
