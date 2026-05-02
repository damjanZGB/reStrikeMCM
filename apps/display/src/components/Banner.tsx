import React, { useEffect, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'

interface Props {
  flagJsonPath: string                      // absolute path
  riseProgress: number                      // 0..1
  targetFraction: number                    // 0..1 — how much of stage height to occupy
  goldTintEnabled?: boolean
}

export function Banner({ flagJsonPath, riseProgress, targetFraction, goldTintEnabled }: Props) {
  const lottieRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  // Mount Lottie once, given path
  useEffect(() => {
    if (!lottieRef.current) return
    let cancelled = false
    fetch('file://' + flagJsonPath)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !lottieRef.current) return
        animRef.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
        })
      })
      .catch(err => console.error('Lottie load failed', err))
    return () => { cancelled = true; animRef.current?.destroy(); animRef.current = null }
  }, [flagJsonPath])

  // Apply rise transform: at riseProgress=0, banner sits at translateY(120%) (off-screen below)
  // at riseProgress=1, banner sits at translateY(0) — its slot height already enforces final position
  const translateY = (1 - riseProgress) * 120  // percent of own height
  const heightPct = targetFraction * 100

  return (
    <div className="banner-slot" style={{ height: `${heightPct}%` }}>
      <div
        ref={lottieRef}
        className={`banner${goldTintEnabled ? ' tint-gold' : ''}`}
        style={{ transform: `translateY(${translateY}%)` }}
      />
    </div>
  )
}
