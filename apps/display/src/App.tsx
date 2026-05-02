import React, { useEffect, useState } from 'react'
import type { PlayoutInstruction } from '@restrike-mcm/shared'
import { PlayoutEngine } from './PlayoutEngine.js'
import { api } from './ipc-bridge.js'

export function App() {
  const [instruction, setInstruction] = useState<PlayoutInstruction | null>(null)
  const [defaultBackdropPath, setDefaultBackdropPath] = useState<string | null>(null)

  useEffect(() => {
    const offPlay = api.ceremony.onPlay(setInstruction)
    const offStop = api.ceremony.onStop(() => setInstruction(null))
    return () => { offPlay(); offStop() }
  }, [])

  useEffect(() => {
    api.display.resolveDefaultBackdrop()
      .then(p => {
        console.log('[display] default backdrop path:', p)
        setDefaultBackdropPath(p)
      })
      .catch(err => console.error('[display] default backdrop resolve failed', err))
  }, [])

  return <PlayoutEngine instruction={instruction} defaultBackdropPath={defaultBackdropPath} />
}
