import React, { useEffect, useState, useMemo } from 'react'
import type { Ceremony, AppConfig } from '@restrike-mcm/shared'
import { useSession } from '../hooks/useSession.js'
import { useConfig } from '../hooks/useConfig.js'
import { api } from '../ipc-bridge.js'
import { randomUUID } from '../hooks/uuid.js'
import { QueuePanel } from '../components/QueuePanel.js'
import { CeremonyEditor } from '../components/CeremonyEditor.js'
import { LivePreview } from '../components/LivePreview.js'
import { DisplayOptionsPanel } from '../components/DisplayOptionsPanel.js'
import { PlayBar } from '../components/PlayBar.js'

function makeCeremony(config: AppConfig): Ceremony {
  return {
    id: randomUUID(),
    category: '', ageCategory: '', discipline: '', gender: 'M',
    bronzeCount: 2,
    athletes: [
      { rank: 'gold',    name: '', noc: '', status: 'empty' },
      { rank: 'silver',  name: '', noc: '', status: 'empty' },
      { rank: 'bronze1', name: '', noc: '', status: 'empty' },
      { rank: 'bronze2', name: '', noc: '', status: 'empty' },
    ],
    display: {
      rankLabelStyle: config.defaults.rankLabelStyle,
      riseCurve:      config.defaults.riseCurve,
      namesMode:      config.defaults.namesMode,
      goldTint:       config.defaults.goldTint,
    },
    status: 'empty',
  }
}

export function Session() {
  const { config } = useConfig()
  const { session, createNew, update } = useSession()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [audioInfo, setAudioInfo] = useState<{ filename: string; durationMs: number } | null>(null)

  // create a default session if none exists
  useEffect(() => { if (!session) createNew(`Session ${new Date().toLocaleDateString()}`) }, [session, createNew])

  const active = session?.ceremonies.find(c => c.id === activeId) ?? null

  // resolve gold-anthem audio info when active changes
  useEffect(() => {
    const goldNoc = active?.athletes.find(a => a.rank === 'gold')?.noc
    if (!goldNoc) { setAudioInfo(null); return }
    let cancelled = false
    api.assets.resolveNoc(goldNoc).then(async r => {
      if (cancelled || !r.anthemPath) { if (!cancelled) setAudioInfo(null); return }
      const { durationMs } = await api.assets.audioDuration(r.anthemPath)
      if (!cancelled) setAudioInfo({ filename: `${goldNoc}.mp3`, durationMs })
    })
    return () => { cancelled = true }
  }, [active?.athletes.find(a => a.rank === 'gold')?.noc])

  if (!config || !session) return <div className="loading">Loading…</div>

  const addCeremony = () => {
    const c = makeCeremony(config)
    update(s => ({ ...s, ceremonies: [...s.ceremonies, c] }))
    setActiveId(c.id)
  }

  const updateActive = (next: Ceremony) => {
    const allReady = next.athletes.every(a => a.status === 'ready')
    const status: Ceremony['status'] = next.status === 'played' ? 'played' :
                                       allReady ? 'ready' :
                                       next.athletes.some(a => a.status !== 'empty') ? 'pending' : 'empty'
    update(s => ({ ...s, ceremonies: s.ceremonies.map(c => c.id === next.id ? { ...next, status } : c) }))
  }

  const handlePlay = async () => {
    if (!active) return
    try {
      await api.ceremony.play(active as any)  // main constructs PlayoutInstruction
    } catch (err) {
      alert(`Cannot play ceremony: ${err}`)
    }
  }

  const handleReset = () => {
    if (!active) return
    updateActive({ ...active, athletes: active.athletes.map(a => ({ ...a, name: '', noc: '', status: 'empty' })) })
  }

  const handleStop = () => api.ceremony.stop()

  return (
    <>
      <header className="titlebar">
        <strong>reStrike MCM</strong>
        <span className="session-label">{session.label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-secondary">⚙ Settings</button>
          <button className="btn-secondary" onClick={() => api.display.push()}>📺 Push to Display 2</button>
        </div>
      </header>
      <main className="session-layout">
        <QueuePanel ceremonies={session.ceremonies} activeId={activeId} onSelect={setActiveId} onAdd={addCeremony} />
        <section className="editor-col">
          {active ? (
            <>
              <CeremonyEditor ceremony={active} config={config} onChange={updateActive} />
              <LivePreview ceremony={active} config={config} />
            </>
          ) : (
            <div className="empty-state">Select or add a ceremony.</div>
          )}
        </section>
        {active && (
          <DisplayOptionsPanel
            display={active.display}
            audioInfo={audioInfo}
            onChange={d => updateActive({ ...active, display: d })}
          />
        )}
      </main>
      <PlayBar
        ceremony={active}
        durationMs={audioInfo?.durationMs ?? null}
        onPlay={handlePlay} onReset={handleReset} onStop={handleStop}
      />
    </>
  )
}
