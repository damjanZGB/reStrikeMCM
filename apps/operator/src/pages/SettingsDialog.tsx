import React, { useState } from 'react'
import type { AppConfig } from '@restrike-mcm/shared'
import { useConfig } from '../hooks/useConfig.js'

interface Props { open: boolean; onClose(): void }

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange(v: string[]): void }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="settings-section">
      <h5>{label}</h5>
      <ul className="settings-list">
        {items.map((s, i) => (
          <li key={i}>
            <input value={s} onChange={e => onChange(items.map((v, j) => j === i ? e.target.value : v))} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </li>
        ))}
      </ul>
      <div className="settings-add">
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="add new…" />
        <button onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft('') } }}>+</button>
      </div>
    </div>
  )
}

export function SettingsDialog({ open, onClose }: Props) {
  const { config, update } = useConfig()
  if (!open || !config) return null

  const set = <K extends keyof AppConfig>(k: K, v: AppConfig[K]) => update({ [k]: v } as Partial<AppConfig>)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header><h3>Settings</h3><button onClick={onClose}>✕</button></header>
        <div className="modal-body">
          <StringList label="Disciplines" items={config.disciplines} onChange={v => set('disciplines', v)} />
          <StringList label="Age categories" items={config.ageCategories} onChange={v => set('ageCategories', v)} />
          <StringList label="Genders" items={config.genders} onChange={v => set('genders', v)} />

          <div className="settings-section">
            <h5>Rank labels — Position</h5>
            <div className="grid-4">
              {config.rankLabels.position.map((s, i) => (
                <input key={i} value={s} onChange={e => {
                  const next = config.rankLabels.position.slice() as [string,string,string,string]
                  next[i] = e.target.value
                  set('rankLabels', { ...config.rankLabels, position: next })
                }} />
              ))}
            </div>
            <h5>Rank labels — Medal</h5>
            <div className="grid-4">
              {config.rankLabels.medal.map((s, i) => (
                <input key={i} value={s} onChange={e => {
                  const next = config.rankLabels.medal.slice() as [string,string,string,string]
                  next[i] = e.target.value
                  set('rankLabels', { ...config.rankLabels, medal: next })
                }} />
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h5>Ceremony title text</h5>
            <input value={config.ceremonyTitleText} onChange={e => set('ceremonyTitleText', e.target.value)} />
          </div>

          <div className="settings-section">
            <h5>Audio fade-out (ms)</h5>
            <input type="number" min={0} max={5000} value={config.audio.fadeOutMs}
              onChange={e => set('audio', { fadeOutMs: parseInt(e.target.value) || 0 })} />
          </div>

          <div className="settings-section">
            <h5>Podium heights (%)</h5>
            <div className="grid-3">
              <label>Gold<input type="number" min={30} max={100} value={config.podium.goldHeightPct}
                onChange={e => set('podium', { ...config.podium, goldHeightPct: parseInt(e.target.value) || 100 })} /></label>
              <label>Silver<input type="number" min={30} max={100} value={config.podium.silverHeightPct}
                onChange={e => set('podium', { ...config.podium, silverHeightPct: parseInt(e.target.value) || 78 })} /></label>
              <label>Bronze<input type="number" min={30} max={100} value={config.podium.bronzeHeightPct}
                onChange={e => set('podium', { ...config.podium, bronzeHeightPct: parseInt(e.target.value) || 58 })} /></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
