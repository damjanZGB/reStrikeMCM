import React from 'react'
import type { Ceremony, AppConfig, Rank } from '@restrike-mcm/shared'

interface Props {
  ceremony: Ceremony
  config: AppConfig
}

const COLOR_FOR: Record<Rank, string> = {
  gold:    '#ddd',
  silver:  '#ccc',
  bronze1: '#bbb',
  bronze2: '#bbb',
}

export function LivePreview({ ceremony, config }: Props) {
  const heightFor = (r: Rank) =>
    r === 'gold'   ? `${config.podium.goldHeightPct}%` :
    r === 'silver' ? `${config.podium.silverHeightPct}%` :
                     `${config.podium.bronzeHeightPct}%`

  // Order: silver, gold, bronze1, bronze2 (as per spec §9.4)
  const ordered: Rank[] = ceremony.bronzeCount === 2
    ? ['silver', 'gold', 'bronze1', 'bronze2']
    : ['silver', 'gold', 'bronze1']

  return (
    <div className="live-preview">
      <div className="lp-label">LIVE PREVIEW · what display 2 shows</div>
      <div className="lp-title">{ceremony.category} · {ceremony.ageCategory} · {ceremony.discipline}</div>
      <div className="lp-event">{config.ceremonyTitleText}</div>
      <div className="lp-stage">
        {ordered.map(r => {
          const a = ceremony.athletes.find(x => x.rank === r)
          if (!a) return null
          return (
            <div key={r} className="lp-col" style={{ height: heightFor(r) }}>
              <div className="lp-banner" style={{ background: COLOR_FOR[r] }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
