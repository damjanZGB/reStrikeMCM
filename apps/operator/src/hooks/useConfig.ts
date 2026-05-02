import { useEffect, useState, useCallback } from 'react'
import type { AppConfig } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.config.get().then(setConfig).catch(e => setError(String(e)))
  }, [])

  const update = useCallback(async (partial: Partial<AppConfig>) => {
    try {
      const next = await api.config.set(partial)
      setConfig(next)
    } catch (e) {
      setError(String(e))
    }
  }, [])

  return { config, error, update }
}
