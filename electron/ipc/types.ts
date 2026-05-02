import type { AppConfig, Ceremony, Session, PlayoutPhase } from '@restrike-mcm/shared'

export interface IpcContract {
  'config:get': { req: void; res: AppConfig }
  'config:set': { req: Partial<AppConfig>; res: AppConfig }
  'session:list': { req: void; res: Session[] }
  'session:load': { req: string; res: Session }
  'session:save': { req: Session; res: void }
  'assets:resolve-noc': { req: string; res: { anthemPath: string|null; flagPath: string|null } }
  'assets:audio-duration': { req: string; res: { durationMs: number } }
  'display:push': { req: void; res: { ok: boolean; reason?: string } }
  'display:reset': { req: void; res: void }
  'ceremony:play': { req: Ceremony; res: void }
  'ceremony:stop': { req: void; res: void }
  'ceremony:phase-change': { req: { phase: PlayoutPhase; t: number }; res: void }
  'fs:pick-file': { req: { name: string; extensions: string[] }[]; res: string | null }
  'assets:changed': { req: void; res: void }
}
