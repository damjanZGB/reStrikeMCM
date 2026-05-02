import { Howl } from 'howler'

export interface AnthemPlayer {
  play(): void
  stop(): void
  scheduleFadeOut(fadeOutMs: number, totalMs: number): void
  onEnd(cb: () => void): void
}

export function createAnthemPlayer(absPath: string): AnthemPlayer {
  let onEndCb: (() => void) | null = null
  const howl = new Howl({
    src: ['file://' + absPath],
    html5: true,
    volume: 1,
    onend: () => onEndCb?.(),
  })

  let fadeTimer: ReturnType<typeof setTimeout> | null = null

  return {
    play() { howl.play() },
    stop() {
      if (fadeTimer) clearTimeout(fadeTimer)
      howl.stop()
    },
    scheduleFadeOut(fadeOutMs: number, totalMs: number) {
      const fadeStartMs = Math.max(0, totalMs - fadeOutMs)
      fadeTimer = setTimeout(() => {
        howl.fade(1, 0, fadeOutMs)
      }, fadeStartMs)
    },
    onEnd(cb) { onEndCb = cb },
  }
}
