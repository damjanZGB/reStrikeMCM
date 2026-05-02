import React, { useEffect, useRef, useState } from 'react'
import type { PlayoutInstruction, PlayoutPhase, Rank, PodiumHeights } from '@restrike-mcm/shared'
import { riseProgress } from '@restrike-mcm/playout'
import { Banner } from './components/Banner.js'
import { createAnthemPlayer, type AnthemPlayer } from './audio.js'
import { api } from './ipc-bridge.js'

interface Props { instruction: PlayoutInstruction | null }

const RANK_BADGE_CLASS: Record<Rank, string> = {
  gold: 'badge-gold', silver: 'badge-silver', bronze1: 'badge-bronze', bronze2: 'badge-bronze',
}
const RANK_INDEX: Record<Rank, 0|1|2|3> = { gold: 0, silver: 1, bronze1: 2, bronze2: 3 }

function targetFractionFor(rank: Rank, podium: PodiumHeights): number {
  if (rank === 'gold')   return podium.goldHeightPct / 100
  if (rank === 'silver') return podium.silverHeightPct / 100
  return podium.bronzeHeightPct / 100
}

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

    if (namesMode === 'title-card') {
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

  const showNames =
    ceremony.display.namesMode === 'fixed' ||
    (ceremony.display.namesMode === 'fade-in' && phase === 'holding') ||
    (ceremony.display.namesMode === 'title-card' && (phase === 'title-card' || phase === 'holding' || phase === 'fading-out' || phase === 'ended'))

  const bannerVisible = phase === 'rising' || phase === 'holding' || phase === 'fading-out' || phase === 'ended'

  // All banners share the same rise progress (simultaneous rise)
  const sharedProgress = riseProgress(ceremony.display.riseCurve, t)

  // Optional 'custom' rank labels fall back to 'position'
  const labels = instruction.config.rankLabels[ceremony.display.rankLabelStyle] ?? instruction.config.rankLabels.position

  return (
    <div className="display-root">
      <div className="backdrop show" style={{ backgroundImage: `url(file://${resolvedAssets.backgroundPath})` }} />

      {phase === 'title-card' && (
        <div className="title-card-overlay">
          <div className="cat">{ceremony.category} · {ceremony.ageCategory} · {ceremony.discipline}</div>
          <div className="event">{instruction.config.ceremonyTitleText}</div>
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

      {bannerVisible && (
        <>
          <div className="title-overlay">
            <div className="cat">{ceremony.category} · {ceremony.ageCategory} · {ceremony.discipline}</div>
            <div className="event">{instruction.config.ceremonyTitleText}</div>
          </div>
          <div className="banner-stage">
            {orderedRanks.map(r => {
              const a = ceremony.athletes.find(x => x.rank === r)!
              const flagPath = (resolvedAssets.flagPaths as any)[r] as string
              return (
                <div key={r} className="banner-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '14%' }}>
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
      )}
    </div>
  )
}
