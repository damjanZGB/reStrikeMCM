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
  // Strip Lottie's source-canvas width/height attrs so the CSS 100%/100%
  // rule wins. Use `meet` so the flag preserves its native aspect inside
  // the banner — banner shape comes from the slot, flag shape from the JSON.
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
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
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        })
        animRef.current = anim
        forceSvgFill(lottieRef.current)
        anim.addEventListener('DOMLoaded', () => forceSvgFill(lottieRef.current))
      })
      .catch(err => console.error('Lottie load failed', err))
    return () => { cancelled = true; animRef.current?.destroy(); animRef.current = null }
  }, [flagJsonPath])

  const translateY = (1 - riseProgress) * 120
  const slotHeightPct = targetFraction * 100

  return (
    <div className={`banner-slot${goldTintEnabled ? ' gold-tint' : ''}`} style={{ height: `${slotHeightPct}%` }}>
      <div ref={lottieRef} className="banner" style={{ transform: `translateY(${translateY}%)` }} />
    </div>
  )
}
