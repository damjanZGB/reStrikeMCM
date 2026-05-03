import type { AppConfig, Ceremony, Session, PlayoutPhase } from '@restrike-mcm/shared'

export interface FileFilter { name: string; extensions: string[] }

export interface OperatorApi {
  config: { get(): Promise<AppConfig>; set(p: Partial<AppConfig>): Promise<AppConfig> }
  session: {
    list(): Promise<Session[]>
    load(id: string): Promise<Session>
    save(s: Session): Promise<void>
    delete(id: string): Promise<void>
  }
  assets: {
    resolveNoc(noc: string): Promise<{ anthemPath: string|null; flagPath: string|null }>
    audioDuration(path: string): Promise<{ durationMs: number }>
    readFlagJson(path: string): Promise<unknown>
    onAssetsChanged(cb: () => void): () => void
  }
  display: {
    push(): Promise<{ ok: boolean; reason?: string }>
    reset(): Promise<void>
    onLost(cb: () => void): () => void
  }
  ceremony: {
    play(c: Ceremony): Promise<void>
    stop(): Promise<void>
    onPhaseChange(cb: (e: { phase: PlayoutPhase; t: number }) => void): () => void
    onShortcutPlay(cb: () => void): () => void
  }
  fs: { pickFile(filters: FileFilter[]): Promise<string | null> }
}

export const api = (window as any).api as OperatorApi
