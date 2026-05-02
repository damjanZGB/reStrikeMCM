import React, { useEffect, useState } from 'react'
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
import { SettingsDialog } from './SettingsDialog.js'
import { SessionLoader } from './SessionLoader.js'
import { ToastList, type Toast } from '../components/Toast.js'
import { deriveCeremonyStatus } from '../lib/derive.js'

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
      textsEnabled:   true,
    },
    status: 'empty',
  }
}

export function Session() {
  const { config } = useConfig()
  const { session, createNew, load, update, save } = useSession()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [audioInfo, setAudioInfo] = useState<{ filename: string; durationMs: number; path: string } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loaderOpen, setLoaderOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (kind: Toast['kind'], message: string) => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), kind, message }])
  }
  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  // Surface display-disconnect events as a toast.
  useEffect(() => {
    return api.display.onLost(() => showToast('error', 'Display 2 disconnected. Replug and click Push to Display 2.'))
  }, [])

  // On startup, prefer the most recently updated saved session;
  // fall back to creating a new one if there are none.
  useEffect(() => {
    if (session) return
    let cancelled = false
    api.session.list()
      .then(list => {
        if (cancelled || session) return
        if (list.length > 0) {
          const latest = list.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]!
          load(latest.id).catch(() => createNew(`Session ${new Date().toLocaleDateString()}`))
        } else {
          createNew(`Session ${new Date().toLocaleDateString()}`)
        }
      })
      .catch(() => createNew(`Session ${new Date().toLocaleDateString()}`))
    return () => { cancelled = true }
  }, [session, createNew, load])

  const active = session?.ceremonies.find(c => c.id === activeId) ?? null

  // resolve gold-anthem audio info when active changes
  useEffect(() => {
    const goldNoc = active?.athletes.find(a => a.rank === 'gold')?.noc
    if (!goldNoc) { setAudioInfo(null); return }
    let cancelled = false
    api.assets.resolveNoc(goldNoc).then(async r => {
      if (cancelled || !r.anthemPath) { if (!cancelled) setAudioInfo(null); return }
      const { durationMs } = await api.assets.audioDuration(r.anthemPath)
      if (!cancelled) setAudioInfo({ filename: `${goldNoc}.mp3`, durationMs, path: r.anthemPath })
    })
    return () => { cancelled = true }
  }, [active?.athletes.find(a => a.rank === 'gold')?.noc])

  if (!config || !session) return <div className="loading">Loading…</div>

  const addCeremony = () => {
    const c = makeCeremony(config)
    update(s => ({ ...s, ceremonies: [...s.ceremonies, c] }))
    setActiveId(c.id)
  }

  const deleteCeremony = (id: string) => {
    update(s => ({ ...s, ceremonies: s.ceremonies.filter(c => c.id !== id) }))
    if (activeId === id) setActiveId(null)
  }

  const updateActive = (next: Ceremony) => {
    const status = deriveCeremonyStatus(next.status, next.athletes)
    update(s => ({ ...s, ceremonies: s.ceremonies.map(c => c.id === next.id ? { ...next, status } : c) }))
  }

  const handleSave = async () => {
    try {
      await save()
      showToast('info', 'Session saved')
    } catch (err) {
      showToast('error', `Save failed: ${err instanceof Error ? err.message : err}`)
    }
  }

  const handlePlay = async () => {
    if (!active) return
    // Auto-save before playing so on-disk state matches what's about to play.
    try {
      await save()
    } catch (err) {
      showToast('error', `Save failed: ${err instanceof Error ? err.message : err}`)
    }
    try {
      await api.ceremony.play(active)  // main constructs PlayoutInstruction
    } catch (err) {
      showToast('error', `Cannot play ceremony: ${err instanceof Error ? err.message : err}`)
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
          <button className="btn-secondary" onClick={handleSave}>💾 Save</button>
          <button className="btn-secondary" onClick={() => setLoaderOpen(true)}>📂 Load session</button>
          <button className="btn-secondary" onClick={() => setSettingsOpen(true)}>⚙ Settings</button>
          <button className="btn-secondary" onClick={() => api.display.push()}>📺 Push to Display 2</button>
        </div>
      </header>
      <main className="session-layout">
        <QueuePanel ceremonies={session.ceremonies} activeId={activeId} onSelect={setActiveId} onAdd={addCeremony} onDelete={deleteCeremony} />
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
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SessionLoader
        open={loaderOpen}
        onClose={() => setLoaderOpen(false)}
        onLoad={async id => { await load(id); setActiveId(null) }}
        activeSessionId={session?.id}
      />
      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
