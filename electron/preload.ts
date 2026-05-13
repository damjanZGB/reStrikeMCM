import { contextBridge, ipcRenderer } from 'electron'

const api = {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (cfg: any) => ipcRenderer.invoke('config:set', cfg),
  },
  session: {
    list: () => ipcRenderer.invoke('session:list'),
    load: (id: string) => ipcRenderer.invoke('session:load', id),
    save: (s: any) => ipcRenderer.invoke('session:save', s),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
  },
  assets: {
    resolveNoc: (noc: string) => ipcRenderer.invoke('assets:resolve-noc', noc),
    audioDuration: (path: string) => ipcRenderer.invoke('assets:audio-duration', path),
    readFlagJson: (path: string) => ipcRenderer.invoke('assets:read-flag-json', path),
    onAssetsChanged: (cb: () => void) => {
      const listener = () => cb()
      ipcRenderer.on('assets:changed', listener)
      return () => ipcRenderer.removeListener('assets:changed', listener)
    },
  },
  display: {
    push: () => ipcRenderer.invoke('display:push'),
    reset: () => ipcRenderer.invoke('display:reset'),
    resolveDefaultBackdrop: () => ipcRenderer.invoke('display:resolve-default-backdrop'),
    getMode: () => ipcRenderer.invoke('display:get-mode'),
    setMoveMode: (enabled: boolean) => ipcRenderer.invoke('display:set-move-mode', enabled),
    setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('display:set-always-on-top', enabled),
    hasSecondary: () => ipcRenderer.invoke('display:has-secondary'),
    onLost: (cb: () => void) => {
      const listener = () => cb()
      ipcRenderer.on('display:lost', listener)
      return () => ipcRenderer.removeListener('display:lost', listener)
    },
    onMoveModeChanged: (cb: (enabled: boolean) => void) => {
      const listener = (_: any, enabled: boolean) => cb(enabled)
      ipcRenderer.on('display:move-mode-changed', listener)
      return () => ipcRenderer.removeListener('display:move-mode-changed', listener)
    },
    onMonitorConfigChanged: (cb: (info: { hasSecondary: boolean }) => void) => {
      const listener = (_: any, info: { hasSecondary: boolean }) => cb(info)
      ipcRenderer.on('display:monitor-config-changed', listener)
      return () => ipcRenderer.removeListener('display:monitor-config-changed', listener)
    },
    onRestartedForTransparency: (cb: (info: { transparentBackground: boolean }) => void) => {
      const listener = (_: any, info: { transparentBackground: boolean }) => cb(info)
      ipcRenderer.on('display:restarted-for-transparency', listener)
      return () => ipcRenderer.removeListener('display:restarted-for-transparency', listener)
    },
  },
  fs: {
    pickFile: (filters: any) => ipcRenderer.invoke('fs:pick-file', filters),
  },
  ceremony: {
    play: (instruction: any) => ipcRenderer.invoke('ceremony:play', instruction),
    stop: () => ipcRenderer.invoke('ceremony:stop'),
    emitPhaseChange: (payload: any) => ipcRenderer.send('ceremony:phase-change', payload),
    onPhaseChange: (cb: (e: any) => void) => {
      const listener = (_: any, payload: any) => cb(payload)
      ipcRenderer.on('ceremony:phase-change', listener)
      return () => ipcRenderer.removeListener('ceremony:phase-change', listener)
    },
    onShortcutPlay: (cb: () => void) => {
      const listener = () => cb()
      ipcRenderer.on('shortcut:play', listener)
      return () => ipcRenderer.removeListener('shortcut:play', listener)
    },
    onPlay: (cb: (instr: any) => void) => {
      const listener = (_: any, payload: any) => cb(payload)
      ipcRenderer.on('ceremony:play', listener)
      return () => ipcRenderer.removeListener('ceremony:play', listener)
    },
    onStop: (cb: () => void) => {
      const listener = () => cb()
      ipcRenderer.on('ceremony:stop', listener)
      return () => ipcRenderer.removeListener('ceremony:stop', listener)
    },
  },
}

contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api
declare global { interface Window { api: Api } }
