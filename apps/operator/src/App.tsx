import React, { useEffect, useState } from 'react'
import type { AppConfig } from '@restrike-mcm/shared'
import { api } from './ipc-bridge.js'

export function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  useEffect(() => { api.config.get().then(setConfig) }, [])
  if (!config) return <div className="loading">Loading…</div>
  return (
    <div className="app">
      <header className="titlebar">
        <strong>reStrike MCM</strong>
        <span className="session-label">No session loaded</span>
      </header>
      <main>Ceremony editor goes here (Tasks 14–19)</main>
    </div>
  )
}
