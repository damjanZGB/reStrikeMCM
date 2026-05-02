import type { PlayoutInstruction, PlayoutPhase } from '@restrike-mcm/shared'

export interface DisplayApi {
  assets: {
    readFlagJson(path: string): Promise<unknown>
  }
  ceremony: {
    onPlay(cb: (i: PlayoutInstruction) => void): () => void
    onStop(cb: () => void): () => void
    emitPhaseChange(p: { phase: PlayoutPhase; t: number }): void
  }
}
export const api = (window as any).api as DisplayApi
