import React, { useEffect, useRef, useState } from 'react'
import type { PlayoutInstruction, PlayoutPhase, Rank, CeremonyTitle } from '@restrike-mcm/shared'
import { riseProgress } from '@restrike-mcm/playout'
import { Banner } from './components/Banner.js'
import { createAnthemPlayer, type AnthemPlayer } from './audio.js'
import { api } from './ipc-bridge.js'
import { isBannerVisible, shouldShowNames, targetFractionFor, flagPathFor } from './lib/playout-helpers.js'

/** Convert a native filesystem path to a file:// URL safe for CSS url() and <img> src. */
function toFileUrl(absPath: string): string {
  // Windows: 'C:\Users\foo' → 'file:///C:/Users/foo'
  // POSIX:   '/Users/foo'    → 'file:///Users/foo'
  const normalized = absPath.replace(/\\/g, '/')
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

function buildTitleStyles(title: CeremonyTitle): { wrapper: React.CSSProperties; text: React.CSSProperties } {
  const tx = title.textAlign === 'left' ? 0 : title.textAlign === 'center' ? -50 : -100
  const ty = title.verticalAlign === 'top' ? 0 : title.verticalAlign === 'middle' ? -50 : -100
  return {
    wrapper: {
      position: 'absolute',
      left: `${title.x}%`,
      top: `${title.y}%`,
      transform: `translate(${tx}%, ${ty}%)`,
      pointerEvents: 'none',
    },
    text: {
      fontFamily: title.fontFamily,
      fontSize: `${title.fontSize}vw`,
      fontWeight: title.fontWeight,
      letterSpacing: `${title.letterSpacing}em`,
      color: title.color,
      textShadow: title.textShadow,
      textAlign: title.textAlign,
      display: 'inline-block',
      whiteSpace: 'nowrap',
    },
  }
}

interface Props { instruction: PlayoutInstruction | null }

const RANK_BADGE_CLASS: Record<Rank, string> = {
  gold: 'badge-gold', silver: 'badge-silver', bronze1: 'badge-bronze', bronze2: 'badge-bronze',
}
const RANK_INDEX: Record<Rank, 0|1|2|3> = { gold: 0, silver: 1, bronze1: 2, bronze2: 3 }

export function PlayoutEngine({ instruction }: Props) {
  const [phase, setPhase] = useState<PlayoutPhase>('idle')
  const [t, setT] = useState(0)
  const startedAtRef = useRef<number | null>(null)
  const audioRef = useRef<AnthemPlayer | null>(null)
  const rafRef = useRef<number | null>(null)

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    audioRef.current?.stop()
    audioRef.current = null
    startedAtRef.current = null
    setPhase('idle')
    setT(0)
  }

  useEffect(() => {
    if (!instruction) { reset(); return }
    const namesMode = instruction.ceremony.display.namesMode
    const textsEnabled = instruction.ceremony.display.textsEnabled !== false
    const totalMs = instruction.anthemDurationMs
    const fadeOutMs = instruction.config.audio.fadeOutMs
    const curve = instruction.ceremony.display.riseCurve

    const startRise = () => {
      setPhase('rising')
      startedAtRef.current = performance.now()
      audioRef.current = createAnthemPlayer(instruction.resolvedAssets.anthemPath)
      audioRef.current.scheduleFadeOut(fadeOutMs, totalMs)
      audioRef.current.onEnd(() => setPhase('ended'))
      audioRef.current.play()

      const tick = () => {
        if (!startedAtRef.current) return
        const elapsed = performance.now() - startedAtRef.current
        const norm = Math.min(1, elapsed / totalMs)
        setT(norm)
        const fullyRisen = riseProgress(curve, norm) >= 1
        if (fullyRisen && phase === 'rising') setPhase('holding')
        if (elapsed >= totalMs - fadeOutMs && phase !== 'fading-out' && phase !== 'ended') {
          setPhase('fading-out')
        }
        if (elapsed >= totalMs) { setPhase('ended'); return }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    // Skip the title-card phase entirely when texts are disabled —
    // otherwise the user gets 3 seconds of empty backdrop with nothing on it.
    if (namesMode === 'title-card' && textsEnabled) {
      setPhase('title-card')
      const tcTimer = setTimeout(startRise, 3000)
      return () => { clearTimeout(tcTimer); reset() }
    } else {
      startRise()
      return reset
    }
  }, [instruction])

  // Forward phase changes to operator
  useEffect(() => { api.ceremony.emitPhaseChange({ phase, t }) }, [phase])

  if (!instruction) return <div className="display-root" />

  const { ceremony, resolvedAssets } = instruction
  const orderedRanks: Rank[] = ceremony.bronzeCount === 2
    ? ['silver', 'gold', 'bronze1', 'bronze2']
    : ['silver', 'gold', 'bronze1']

  const textsEnabled = ceremony.display.textsEnabled !== false
  const showNames = textsEnabled && shouldShowNames(ceremony.display.namesMode, phase)
  const bannerVisible = isBannerVisible(phase)

  // All banners share the same rise progress (simultaneous rise)
  const sharedProgress = riseProgress(ceremony.display.riseCurve, t)

  // Optional 'custom' rank labels fall back to 'position'
  const labels = instruction.config.rankLabels[ceremony.display.rankLabelStyle] ?? instruction.config.rankLabels.position

  return (
    <div className="display-root">
      <div className="backdrop show" style={{ backgroundImage: `url("${toFileUrl(resolvedAssets.backgroundPath)}")` }} />

      {phase === 'title-card' && textsEnabled && (
        <div className="title-card-overlay">
          <div className="cat">{ceremony.category} · {ceremony.ageCategory} · {ceremony.discipline}</div>
          <div className="event" style={{ color: instruction.config.title.color }}>{instruction.config.title.text}</div>
          <ul className="tc-medalists">
            {orderedRanks.map(r => {
              const a = ceremony.athletes.find(x => x.rank === r)!
              return (
                <li key={r}>
                  <span className={`medal-badge ${RANK_BADGE_CLASS[r]}`}>{labels[RANK_INDEX[r]]}</span>
                  {a.name} <em>{a.noc}</em>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {bannerVisible && (() => {
        const titleStyles = buildTitleStyles(instruction.config.title)
        return (
        <>
          {textsEnabled && (
            <>
              <div className="title-overlay">
                <div className="cat">{ceremony.category} · {ceremony.ageCategory} · {ceremony.discipline}</div>
              </div>
              <div className="display-title" style={titleStyles.wrapper}>
                <span
                  key={`anim-${instruction.config.title.animation}-${ceremony.id}`}
                  className={`title-anim title-anim-${instruction.config.title.animation}`}
                  style={titleStyles.text}>
                  {instruction.config.title.text}
                </span>
              </div>
            </>
          )}
          <div className="banner-stage">
            {orderedRanks.map(r => {
              const a = ceremony.athletes.find(x => x.rank === r)!
              const flagPath = flagPathFor(r, resolvedAssets.flagPaths)
              return (
                <div key={r} className="banner-col">
                  <Banner
                    flagJsonPath={flagPath}
                    riseProgress={sharedProgress}
                    targetFraction={targetFractionFor(r, instruction.config.podium)}
                    goldTintEnabled={r === 'gold' && ceremony.display.goldTint}
                  />
                  {showNames && (
                    <div className="name-tag">
                      <span className={`medal-badge ${RANK_BADGE_CLASS[r]}`}>{labels[RANK_INDEX[r]]}</span>
                      <div className="name">{a.name}</div>
                      <div className="noc">{a.noc}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
        )
      })()}
    </div>
  )
}
