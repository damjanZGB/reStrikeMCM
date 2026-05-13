import type { CeremonyDisplayOptions } from '@restrike-mcm/shared'

export interface DisplayModeGlobal {
  transparentBackground: boolean
  backdropEnabled: boolean
}

export interface DisplayMode {
  transparent: boolean
  backdropOn: boolean
}

/**
 * Resolve the effective display mode for the current frame.
 * Per-ceremony override (when defined) wins over the global default.
 * When no ceremony is active, the global default applies.
 */
export function resolveDisplayMode(
  display: CeremonyDisplayOptions | null,
  global: DisplayModeGlobal,
): DisplayMode {
  return {
    transparent: display?.transparentBackground ?? global.transparentBackground,
    backdropOn:  display?.backdropEnabled       ?? global.backdropEnabled,
  }
}
