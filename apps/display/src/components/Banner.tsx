import React, { useEffect, useRef, useState } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import { api } from '../ipc-bridge.js'

interface Props {
  flagJsonPath: string                      // absolute path
  riseProgress: number                      // 0..1
  targetFraction: number                    // 0..1 — slot height as fraction of stage
  goldTintEnabled?: boolean | undefined
}

function forceSvgFill(container: HTMLDivElement | null): void {
  const svg = container?.querySelector('svg')
  if (!svg) return
  // The banner is sized to match the flag's aspect, so the SVG fills it
  // edge-to-edge. meet is the safe default (no cropping if anything mismatches).
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.style.cssText = 'width: 100%; height: 100%; display: block;'
}

export function Banner({ flagJsonPath, riseProgress, targetFraction, goldTintEnabled }: Props) {
  const lottieRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const [aspectRatio, setAspectRatio] = useState<string>('2 / 3')

  useEffect(() => {
    if (!lottieRef.current) return
    let cancelled = false
    api.assets.readFlagJson(flagJsonPath)
      .then(data => {
        if (cancelled || !lottieRef.current) return
        // Pick the banner aspect from the flag's source canvas — banner
        // becomes exactly the flag's shape, no letterbox / no crop.
        const d = data as { w?: number; h?: number }
        if (typeof d.w === 'number' && typeof d.h === 'number' && d.w > 0 && d.h > 0) {
          setAspectRatio(`${d.w} / ${d.h}`)
        }
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

  // Translate in vh, not %-of-own-height: at rise=0 the banner is pushed
  // 100vh below its anchor — always off-screen regardless of slot top or
  // banner height. With %-of-banner-height (the old approach) the actual
  // off-screen distance varied per banner, leaving short banners with
  // 1/3 already visible at start.
  const translateYvh = (1 - riseProgress) * 100
  const slotHeightPct = targetFraction * 100

  return (
    <div className={`banner-slot${goldTintEnabled ? ' gold-tint' : ''}`} style={{ height: `${slotHeightPct}%` }}>
      <div ref={lottieRef} className="banner" style={{ transform: `translateY(${translateYvh}vh)`, aspectRatio }} />
    </div>
  )
}
