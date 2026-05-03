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
    onLost: (cb: () => void) => {
      const listener = () => cb()
      ipcRenderer.on('display:lost', listener)
      return () => ipcRenderer.removeListener('display:lost', listener)
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
