import React from 'react'
import type { Athlete } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'

interface Props { athlete: Athlete; missing: 'anthem'|'flag'|'both'; onSubstitute(a: Athlete): void }

export function SubstituteButton({ athlete, missing, onSubstitute }: Props) {
  const handleClick = async () => {
    const filters = missing === 'flag'
      ? [{ name: 'Lottie JSON', extensions: ['json'] }]
      : [{ name: 'MP3 Audio', extensions: ['mp3'] }]
    const path = await api.fs.pickFile(filters)
    if (!path) return
    if (missing === 'anthem') onSubstitute({ ...athlete, anthemOverride: path })
    else if (missing === 'flag') onSubstitute({ ...athlete, flagOverride: path })
    else onSubstitute({ ...athlete, anthemOverride: path }) // pick anthem first; flag second click
  }
  return <button className="btn-substitute" onClick={handleClick}>Substitute…</button>
}
