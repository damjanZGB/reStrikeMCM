import React, { useEffect, useState } from 'react'
import type { AppConfig, CeremonyTitle, TitleAnimation, HorizontalAlign, VerticalAlign } from '@restrike-mcm/shared'
import { useConfig } from '../hooks/useConfig.js'
import { api } from '../ipc-bridge.js'

const shortName = (p: string) => p.split(/[\\/]/).pop() ?? p

const FONT_FAMILIES = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: '"Arial Black", sans-serif', label: 'Arial Black' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
]

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
  const [recordingShortcut, setRecordingShortcut] = useState(false)

  useEffect(() => {
    if (!recordingShortcut || !open || !config) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const k = e.key
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(k)) return
      const mods: string[] = []
      if (e.ctrlKey)  mods.push('Control')
      if (e.altKey)   mods.push('Alt')
      if (e.shiftKey) mods.push('Shift')
      if (e.metaKey)  mods.push('Meta')
      if (mods.length === 0) return
      const keyName = k.length === 1 ? k.toUpperCase() : k
      const accelerator = [...mods, keyName].join('+')
      setRecordingShortcut(false)
      update({ playShortcut: accelerator })
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [recordingShortcut, open, config, update])

  if (!open || !config) return null

  const set = <K extends keyof AppConfig>(k: K, v: AppConfig[K]) => update({ [k]: v } as Partial<AppConfig>)
  const setTitle = (partial: Partial<CeremonyTitle>) => set('title', { ...config.title, ...partial })

  const pickDefaultBackdrop = async () => {
    const path = await api.fs.pickFile([{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp'] }])
    if (path) set('defaultBackgroundCustomPath', path)
  }

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
            <h5>Title — text</h5>
            <input value={config.title.text} onChange={e => setTitle({ text: e.target.value })} />

            <h5 style={{ marginTop: 14 }}>Title — typography</h5>
            <div className="grid-2">
              <label>Font family
                <select value={config.title.fontFamily} onChange={e => setTitle({ fontFamily: e.target.value })}>
                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
              <label>Font weight
                <select value={config.title.fontWeight} onChange={e => setTitle({ fontWeight: parseInt(e.target.value) })}>
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>
            <div className="grid-2">
              <label>Font size (vw)
                <input type="number" min="0.5" max="20" step="0.1"
                  value={config.title.fontSize}
                  onChange={e => setTitle({ fontSize: parseFloat(e.target.value) || 2.5 })} />
              </label>
              <label>Letter spacing (em)
                <input type="number" min="-1" max="2" step="0.01"
                  value={config.title.letterSpacing}
                  onChange={e => setTitle({ letterSpacing: parseFloat(e.target.value) || 0 })} />
              </label>
            </div>
            <label>Color
              <input type="color" value={config.title.color}
                onChange={e => setTitle({ color: e.target.value })} />
            </label>

            <h5 style={{ marginTop: 14 }}>Title — effects</h5>
            <label>Drop shadow (CSS text-shadow)
              <input value={config.title.textShadow}
                onChange={e => setTitle({ textShadow: e.target.value })}
                placeholder="0 2px 8px rgba(0, 0, 0, 0.8)" />
            </label>
            <label>Animation
              <select value={config.title.animation}
                onChange={e => setTitle({ animation: e.target.value as TitleAnimation })}>
                <option value="none">None</option>
                <option value="fade-in">Fade in</option>
                <option value="pulse">Pulse</option>
                <option value="glow">Glow</option>
                <option value="slide-down">Slide down</option>
                <option value="zoom">Zoom</option>
              </select>
            </label>

            <h5 style={{ marginTop: 14 }}>Title — position</h5>
            <div className="grid-2">
              <label>Horizontal alignment
                <select value={config.title.textAlign}
                  onChange={e => setTitle({ textAlign: e.target.value as HorizontalAlign })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label>Vertical alignment
                <select value={config.title.verticalAlign}
                  onChange={e => setTitle({ verticalAlign: e.target.value as VerticalAlign })}>
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </label>
            </div>
            <div className="grid-2">
              <label>X position (% of viewport width)
                <input type="number" min="0" max="100" step="1"
                  value={config.title.x}
                  onChange={e => setTitle({ x: parseFloat(e.target.value) || 50 })} />
              </label>
              <label>Y position (% of viewport height)
                <input type="number" min="0" max="100" step="1"
                  value={config.title.y}
                  onChange={e => setTitle({ y: parseFloat(e.target.value) || 14 })} />
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h5>Display output</h5>
            <label className="toggle-row">Transparent background output (for OBS/vMix capture)
              <input
                type="checkbox"
                checked={config.transparentBackground}
                onChange={e => set('transparentBackground', e.target.checked)}
              />
            </label>
            <div className="settings-hint">
              Opens the display window with an alpha channel. The display window restarts when this changes.
            </div>
            <label className="toggle-row" style={{ marginTop: 8 }}>Show backdrop image
              <input
                type="checkbox"
                checked={config.backdropEnabled}
                onChange={e => set('backdropEnabled', e.target.checked)}
              />
            </label>
          </div>

          <div className="settings-section">
            <h5>Default backdrop image</h5>
            <div className="bg-row">
              <span className="bg-current">
                {config.defaultBackgroundCustomPath
                  ? `🖼️ ${shortName(config.defaultBackgroundCustomPath)}`
                  : `Bundled: ${config.defaultBackground}`}
              </span>
              <div className="bg-actions">
                <button className="btn-secondary" onClick={pickDefaultBackdrop}>Choose…</button>
                {config.defaultBackgroundCustomPath && (
                  <button className="btn-secondary" onClick={() => set('defaultBackgroundCustomPath', undefined)}>
                    Reset to bundled
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h5>Audio fade-out (ms)</h5>
            <input type="number" min={0} max={5000} value={config.audio.fadeOutMs}
              onChange={e => set('audio', { fadeOutMs: parseInt(e.target.value) || 0 })} />
          </div>

          <div className="settings-section">
            <h5>PLAY shortcut (global hotkey)</h5>
            <div className="shortcut-row">
              <kbd className="shortcut-current">{config.playShortcut}</kbd>
              {recordingShortcut ? (
                <>
                  <span className="shortcut-hint">Press the new shortcut…</span>
                  <button className="btn-secondary" onClick={() => setRecordingShortcut(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => setRecordingShortcut(true)}>Change…</button>
                  <button className="btn-secondary" onClick={() => set('playShortcut', 'Control+Alt+P')}>Reset</button>
                </>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h5>Flag hold time after anthem (seconds)</h5>
            <input type="number" min={0} max={60} step={0.5}
              value={config.flagHoldMs / 1000}
              onChange={e => set('flagHoldMs', Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 1000)))} />
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
