import React, { useEffect, useRef, useState } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import { api } from '../ipc-bridge.js'

interface Props {
  noc: string                // 3-letter code; '' or partial → empty placeholder
  heightPct: number          // podium fraction (0..100)
}

/**
 * Small Lottie-rendered flag banner for the operator's LivePreview.
 * Same content as Display 2's Banner, sized for the preview tile.
 * If NOC has no resolved flag, falls back to a neutral placeholder.
 */
export function MiniBanner({ noc, heightPct }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const [hasFlag, setHasFlag] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false
    animRef.current?.destroy()
    animRef.current = null
    setHasFlag(false)

    if (noc.length !== 3) return

    api.assets.resolveNoc(noc).then(r => {
      if (cancelled || !r.flagPath || !ref.current) return
      api.assets.readFlagJson(r.flagPath).then(data => {
        if (cancelled || !ref.current) return
        animRef.current = lottie.loadAnimation({
          container: ref.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
        })
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
      <div ref={ref} className={`mini-banner${hasFlag ? '' : ' empty'}`} />
    </div>
  )
}
