import React, { useEffect, useState } from 'react'
import type { Athlete, Rank } from '@restrike-mcm/shared'
import { api } from '../ipc-bridge.js'
import { SubstituteButton } from './SubstituteButton.js'

interface Props {
  athlete: Athlete
  onChange(a: Athlete): void
  optional?: boolean
}

const RANK_LABEL: Record<Rank, { num: string; cls: string }> = {
  gold:    { num: '1ST', cls: 'gold' },
  silver:  { num: '2ND', cls: 'silver' },
  bronze1: { num: '3RD', cls: 'bronze' },
  bronze2: { num: '3RD', cls: 'bronze' },
}

export function AthleteRow({ athlete, onChange, optional }: Props) {
  const [resolution, setResolution] = useState<{ anthem: string|null; flag: string|null } | null>(null)
  const [assetsVersion, setAssetsVersion] = useState(0)

  // Re-resolve when chokidar reports an asset added/removed.
  useEffect(() => {
    return api.assets.onAssetsChanged(() => setAssetsVersion(v => v + 1))
  }, [])

  useEffect(() => {
    if (!athlete.noc) { setResolution(null); return }
    let cancelled = false
    api.assets.resolveNoc(athlete.noc).then(r => {
      if (cancelled) return
      setResolution({ anthem: r.anthemPath, flag: r.flagPath })
      const allFound = !!r.anthemPath && !!r.flagPath
      const overrideOk = !!athlete.anthemOverride && !!athlete.flagOverride
      const ready = allFound || overrideOk || (r.anthemPath && athlete.flagOverride) || (r.flagPath && athlete.anthemOverride)
      onChange({ ...athlete, status: ready ? 'ready' : 'pending' })
    })
    return () => { cancelled = true }
  }, [athlete.noc, assetsVersion])

  const dotClass =
    athlete.status === 'ready' ? 'status-dot status-ok' :
    athlete.status === 'pending' ? 'status-dot status-warn' :
    'status-dot status-empty'

  const tooltip = resolution
    ? [resolution.anthem ? null : 'anthem missing', resolution.flag ? null : 'flag missing'].filter(Boolean).join(', ') || 'all assets found'
    : 'enter NOC'

  const meta = RANK_LABEL[athlete.rank]
  return (
    <div className={`athlete-row ${meta.cls} ${optional ? 'optional' : ''}`}>
      <div className="pos">{meta.num}</div>
      <input
        value={athlete.name}
        onChange={e => onChange({ ...athlete, name: e.target.value })}
        placeholder="Surname First"
      />
      <input
        value={athlete.noc}
        onChange={e => onChange({ ...athlete, noc: e.target.value.toUpperCase().slice(0, 3) })}
        placeholder="NOC"
        maxLength={3}
      />
      <div className={dotClass} title={tooltip} />
      {athlete.status === 'pending' && resolution && (
        <div className="substitute-row">
          {!resolution.anthem && !athlete.anthemOverride && (
            <SubstituteButton athlete={athlete} missing="anthem" onSubstitute={onChange} />
          )}
          {!resolution.flag && !athlete.flagOverride && (
            <SubstituteButton athlete={athlete} missing="flag" onSubstitute={onChange} />
          )}
        </div>
      )}
    </div>
  )
}
