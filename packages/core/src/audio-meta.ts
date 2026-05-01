import { parseFile } from 'music-metadata'

export async function readMp3Duration(absPath: string): Promise<number> {
  const md = await parseFile(absPath, { duration: true })
  const seconds = md.format.duration
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Invalid or missing duration in ${absPath}`)
  }
  return Math.round(seconds * 1000)
}
