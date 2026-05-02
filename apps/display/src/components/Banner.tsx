import React, { useEffect, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import { api } from '../ipc-bridge.js'

interface Props {
  flagJsonPath: string                      // absolute path
  riseProgress: number                      // 0..1
  targetFraction: number                    // 0..1 — how much of stage height to occupy
  goldTintEnabled?: boolean | undefined
}

function forceSvgFill(container: HTMLDivElement | null): void {
  const svg = container?.querySelector('svg')
  if (!svg) return
  // Lottie sets width/height from the source canvas (e.g., 445×900). Strip those
  // and force the SVG to fill its container; use `slice` so the flag fills
  // (cropping over-wide content rather than letterboxing).
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice')
  svg.style.cssText = 'width: 100%; height: 100%; display: block;'
}

export function Banner({ flagJsonPath, riseProgress, targetFraction, goldTintEnabled }: Props) {
  const lottieRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!lottieRef.current) return
    let cancelled = false
    api.assets.readFlagJson(flagJsonPath)
      .then(data => {
        if (cancelled || !lottieRef.current) return
        const anim = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
        })
        animRef.current = anim
        // Lottie creates the SVG synchronously but the inner <image> base64
        // asset finishes decoding asynchronously — by which point Lottie has
        // re-set width/height attributes to the asset's native size. Override
        // both immediately AND after DOMLoaded fires.
        forceSvgFill(lottieRef.current)
        anim.addEventListener('DOMLoaded', () => forceSvgFill(lottieRef.current))
      })
      .catch(err => console.error('Lottie load failed', err))
    return () => { cancelled = true; animRef.current?.destroy(); animRef.current = null }
  }, [flagJsonPath])

  // Rise transform: at riseProgress=0, banner sits at translateY(120%) — off-screen below.
  // At riseProgress=1, translateY(0) — anchored at slot bottom.
  const translateY = (1 - riseProgress) * 120
  const slotHeightPct = targetFraction * 100

  return (
    <div className={`banner-slot${goldTintEnabled ? ' gold-tint' : ''}`} style={{ height: `${slotHeightPct}%` }}>
      <div
        ref={lottieRef}
        className="banner"
        style={{ transform: `translateY(${translateY}%)` }}
      />
    </div>
  )
}
