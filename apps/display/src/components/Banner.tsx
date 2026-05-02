import React, { useEffect, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import { api } from '../ipc-bridge.js'

interface Props {
  flagJsonPath: string                      // absolute path
  riseProgress: number                      // 0..1
  targetFraction: number                    // 0..1 — how much of stage height to occupy
  goldTintEnabled?: boolean | undefined
}

export function Banner({ flagJsonPath, riseProgress, targetFraction, goldTintEnabled }: Props) {
  const lottieRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  // Mount Lottie once, given path. Loads JSON via IPC (renderer can't fetch file://).
  useEffect(() => {
    if (!lottieRef.current) return
    let cancelled = false
    api.assets.readFlagJson(flagJsonPath)
      .then(data => {
        if (cancelled || !lottieRef.current) return
        animRef.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
        })
        // Lottie sets the SVG's width/height attributes from the animation's
        // canvas size; clear them so our 100%/100% CSS rule actually wins.
        const svg = lottieRef.current.querySelector('svg')
        if (svg) {
          svg.removeAttribute('width')
          svg.removeAttribute('height')
          svg.setAttribute('preserveAspectRatio', 'xMidYMid slice')
        }
      })
      .catch(err => console.error('Lottie load failed', err))
    return () => { cancelled = true; animRef.current?.destroy(); animRef.current = null }
  }, [flagJsonPath])

  // Apply rise transform: at riseProgress=0, banner sits at translateY(120%) (off-screen below)
  // at riseProgress=1, banner sits at translateY(0) — its slot height already enforces final position
  const translateY = (1 - riseProgress) * 120  // percent of own height
  const heightPct = targetFraction * 100

  return (
    <div className={`banner-slot${goldTintEnabled ? ' gold-tint' : ''}`} style={{ height: `${heightPct}%` }}>
      <div
        ref={lottieRef}
        className="banner"
        style={{ transform: `translateY(${translateY}%)` }}
      />
    </div>
  )
}
