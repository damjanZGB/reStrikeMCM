import type { AppConfig, Session, PlayoutInstruction, PlayoutPhase } from '@restrike-mcm/shared'

export interface OperatorApi {
  config: { get(): Promise<AppConfig>; set(p: Partial<AppConfig>): Promise<AppConfig> }
  session: { list(): Promise<Session[]>; load(id: string): Promise<Session>; save(s: Session): Promise<void> }
  assets: {
    resolveNoc(noc: string): Promise<{ anthemPath: string|null; flagPath: string|null }>
    audioDuration(path: string): Promise<{ durationMs: number }>
  }
  display: { push(): Promise<{ ok: boolean; reason?: string }>; reset(): Promise<void> }
  ceremony: {
    play(i: PlayoutInstruction): Promise<void>
    stop(): Promise<void>
    onPhaseChange(cb: (e: { phase: PlayoutPhase; t: number }) => void): () => void
  }
}

export const api = (window as any).api as OperatorApi
