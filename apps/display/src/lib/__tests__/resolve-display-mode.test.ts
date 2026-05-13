import { describe, it, expect } from 'vitest'
import type { CeremonyDisplayOptions } from '@restrike-mcm/shared'
import { resolveDisplayMode } from '../resolve-display-mode.js'

const base: CeremonyDisplayOptions = {
  rankLabelStyle: 'position', riseCurve: 'rise-hold', namesMode: 'title-card',
  goldTint: false, textsEnabled: true,
}

describe('resolveDisplayMode', () => {
  it('inherits global when both per-ceremony fields are undefined', () => {
    const got = resolveDisplayMode(base, { transparentBackground: true, backdropEnabled: false })
    expect(got).toEqual({ transparent: true, backdropOn: false })
  })

  it('per-ceremony transparent override wins over global', () => {
    const got = resolveDisplayMode({ ...base, transparentBackground: false }, { transparentBackground: true, backdropEnabled: true })
    expect(got.transparent).toBe(false)
  })

  it('per-ceremony backdrop override wins over global', () => {
    const got = resolveDisplayMode({ ...base, backdropEnabled: true }, { transparentBackground: false, backdropEnabled: false })
    expect(got.backdropOn).toBe(true)
  })

  it('returns sensible defaults when no ceremony is active', () => {
    const got = resolveDisplayMode(null, { transparentBackground: false, backdropEnabled: true })
    expect(got).toEqual({ transparent: false, backdropOn: true })
  })

  it('full truth table coverage — overrides false', () => {
    const got = resolveDisplayMode(
      { ...base, transparentBackground: false, backdropEnabled: false },
      { transparentBackground: true, backdropEnabled: true },
    )
    expect(got).toEqual({ transparent: false, backdropOn: false })
  })
})
