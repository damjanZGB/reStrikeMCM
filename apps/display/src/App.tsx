import React, { useEffect, useState } from 'react'
import type { PlayoutInstruction } from '@restrike-mcm/shared'
import { PlayoutEngine } from './PlayoutEngine.js'
import { api } from './ipc-bridge.js'
import { resolveDisplayMode } from './lib/resolve-display-mode.js'

export function App() {
  const [instruction, setInstruction] = useState<PlayoutInstruction | null>(null)
  const [defaultBackdropPath, setDefaultBackdropPath] = useState<string | null>(null)
  const [globalMode, setGlobalMode] = useState<{ transparentBackground: boolean; backdropEnabled: boolean }>({
    transparentBackground: false,
    backdropEnabled: true,
  })
  const [moveMode, setMoveMode] = useState(false)

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

  useEffect(() => {
    api.display.getMode().then(setGlobalMode).catch(err => console.error('[display] getMode failed', err))
  }, [])

  useEffect(() => {
    return api.display.onMoveModeChanged(setMoveMode)
  }, [])

  const mode = resolveDisplayMode(instruction?.ceremony.display ?? null, globalMode)

  // Toggle the `.transparent` class on html/body/#root so the CSS rules in
  // styles.css can strip solid backgrounds when transparent mode is on.
  useEffect(() => {
    const root = document.getElementById('root')
    document.documentElement.classList.toggle('transparent', mode.transparent)
    document.body.classList.toggle('transparent', mode.transparent)
    root?.classList.toggle('transparent', mode.transparent)
  }, [mode.transparent])

  return (
    <>
      <PlayoutEngine
        instruction={instruction}
        defaultBackdropPath={defaultBackdropPath}
        transparent={mode.transparent}
        backdropOn={mode.backdropOn}
      />
      {moveMode && (
        <>
          <div className="move-handle-top" />
          <div className="move-handle-corner" />
        </>
      )}
    </>
  )
}
