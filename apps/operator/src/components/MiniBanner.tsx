import React, { useEffect, useRef, useState } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import { api } from '../ipc-bridge.js'

interface Props {
  noc: string                // 3-letter code; '' or partial → empty placeholder
  heightPct: number          // podium fraction (0..100)
}

/**
 * Small Lottie-rendered flag banner for the operator's LivePreview.
 * Banner width matches the slot; height adapts to the flag's native
 * aspect ratio so each flag renders at its true shape.
 */
export function MiniBanner({ noc, heightPct }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const [hasFlag, setHasFlag] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string>('2 / 3')

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false
    animRef.current?.destroy()
    animRef.current = null
    setHasFlag(false)
    setAspectRatio('2 / 3')

    if (noc.length !== 3) return

    api.assets.resolveNoc(noc).then(r => {
      if (cancelled || !r.flagPath || !ref.current) return
      api.assets.readFlagJson(r.flagPath).then(data => {
        if (cancelled || !ref.current) return
        const d = data as { w?: number; h?: number }
        if (typeof d.w === 'number' && typeof d.h === 'number' && d.w > 0 && d.h > 0) {
          setAspectRatio(`${d.w} / ${d.h}`)
        }
        animRef.current = lottie.loadAnimation({
          container: ref.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        })
        const svg = ref.current.querySelector('svg')
        if (svg) {
          svg.removeAttribute('width')
          svg.removeAttribute('height')
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
        }
        setHasFlag(true)
      }).catch(err => console.error('[mini-banner] readFlagJson', err))
    }).catch(err => console.error('[mini-banner] resolveNoc', err))

    return () => {
      cancelled = true
      animRef.current?.destroy()
      animRef.current = null
    }
  }, [noc])

  return (
    <div className="mini-banner-slot" style={{ height: `${heightPct}%` }}>
      <div ref={ref} className={`mini-banner${hasFlag ? '' : ' empty'}`} style={{ aspectRatio }} />
    </div>
  )
}
