import React, { useEffect, useState } from 'react'
import type { PlayoutInstruction } from '@restrike-mcm/shared'
import { PlayoutEngine } from './PlayoutEngine.js'
import { api } from './ipc-bridge.js'

export function App() {
  const [instruction, setInstruction] = useState<PlayoutInstruction | null>(null)
  useEffect(() => {
    const offPlay = api.ceremony.onPlay(setInstruction)
    const offStop = api.ceremony.onStop(() => setInstruction(null))
    return () => { offPlay(); offStop() }
  }, [])
  return <PlayoutEngine instruction={instruction} />
}
