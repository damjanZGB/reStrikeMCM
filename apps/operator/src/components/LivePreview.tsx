import React from 'react'
import type { Ceremony, AppConfig, Rank } from '@restrike-mcm/shared'
import { MiniBanner } from './MiniBanner.js'

interface Props {
  ceremony: Ceremony
  config: AppConfig
}

export function LivePreview({ ceremony, config }: Props) {
  const heightFor = (r: Rank): number =>
    r === 'gold'   ? config.podium.goldHeightPct :
    r === 'silver' ? config.podium.silverHeightPct :
                     config.podium.bronzeHeightPct

  // Order: silver, gold, bronze1, bronze2 (as per spec §9.4)
  const ordered: Rank[] = ceremony.bronzeCount === 2
    ? ['silver', 'gold', 'bronze1', 'bronze2']
    : ['silver', 'gold', 'bronze1']

  return (
    <div className="live-preview">
      <div className="lp-label">LIVE PREVIEW · what display 2 shows</div>
      <div className="lp-title">{ceremony.category} · {ceremony.ageCategory} · {ceremony.discipline}</div>
      <div className="lp-event" style={{ color: config.title.color }}>{config.title.text}</div>
      <div className="lp-stage">
        {ordered.map(r => {
          const a = ceremony.athletes.find(x => x.rank === r)
          if (!a) return null
          return (
            <div key={r} className="lp-col">
              <MiniBanner noc={a.noc} heightPct={heightFor(r)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
