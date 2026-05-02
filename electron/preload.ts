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
  },
  assets: {
    resolveNoc: (noc: string) => ipcRenderer.invoke('assets:resolve-noc', noc),
    audioDuration: (path: string) => ipcRenderer.invoke('assets:audio-duration', path),
  },
  display: {
    push: () => ipcRenderer.invoke('display:push'),
    reset: () => ipcRenderer.invoke('display:reset'),
  },
  ceremony: {
    play: (instruction: any) => ipcRenderer.invoke('ceremony:play', instruction),
    stop: () => ipcRenderer.invoke('ceremony:stop'),
    onPhaseChange: (cb: (e: any) => void) => {
      const listener = (_: any, payload: any) => cb(payload)
      ipcRenderer.on('ceremony:phase-change', listener)
      return () => ipcRenderer.removeListener('ceremony:phase-change', listener)
    },
  },
}

contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api
declare global { interface Window { api: Api } }
