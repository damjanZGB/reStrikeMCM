import React from 'react'
import type { Ceremony, Athlete, Gender, AppConfig } from '@restrike-mcm/shared'
import { AthleteRow } from './AthleteRow.js'

interface Props {
  ceremony: Ceremony
  config: AppConfig
  onChange(c: Ceremony): void
}

const GENDERS: Gender[] = ['M', 'F', 'X']

export function CeremonyEditor({ ceremony, config, onChange }: Props) {
  const updateField = <K extends keyof Ceremony>(k: K, v: Ceremony[K]) => onChange({ ...ceremony, [k]: v })
  const updateAthlete = (idx: number, a: Athlete) => {
    const athletes = ceremony.athletes.slice()
    athletes[idx] = a
    onChange({ ...ceremony, athletes })
  }

  const toggleBronze2 = (enabled: boolean) => {
    if (enabled && ceremony.bronzeCount === 1) {
      const next: Ceremony = {
        ...ceremony, bronzeCount: 2,
        athletes: [...ceremony.athletes, { rank: 'bronze2', name: '', noc: '', status: 'empty' }],
      }
      onChange(next)
    } else if (!enabled && ceremony.bronzeCount === 2) {
      onChange({ ...ceremony, bronzeCount: 1, athletes: ceremony.athletes.filter(a => a.rank !== 'bronze2') })
    }
  }

  return (
    <div className="ceremony-editor">
      <h4>Active ceremony · {ceremony.category || '(no category)'} · {ceremony.ageCategory || '(no age)'}</h4>

      <div className="grid-2">
        <label>Category / weight
          <input value={ceremony.category} onChange={e => updateField('category', e.target.value)} placeholder="e.g. M −68 kg" />
        </label>
        <label>Age category
          <input list="age-cats" value={ceremony.ageCategory} onChange={e => updateField('ageCategory', e.target.value)} />
          <datalist id="age-cats">{config.ageCategories.map(a => <option key={a} value={a} />)}</datalist>
        </label>
      </div>

      <div className="grid-2">
        <label>Discipline
          <input list="disciplines" value={ceremony.discipline} onChange={e => updateField('discipline', e.target.value)} />
          <datalist id="disciplines">{config.disciplines.map(d => <option key={d} value={d} />)}</datalist>
        </label>
        <label>Gender
          <select value={ceremony.gender} onChange={e => updateField('gender', e.target.value as Gender)}>
            {GENDERS.map((g, i) => <option key={g} value={g}>{config.genders[i] ?? g}</option>)}
          </select>
        </label>
      </div>

      <h4>Medalists</h4>
      {ceremony.athletes.map((a, idx) => (
        <AthleteRow key={a.rank} athlete={a} onChange={n => updateAthlete(idx, n)} optional={a.rank === 'bronze2'} />
      ))}

      <label className="cb-row">
        <input type="checkbox" checked={ceremony.bronzeCount === 2} onChange={e => toggleBronze2(e.target.checked)} />
        4th medalist enabled (TKD/Judo/Wrestling)
      </label>
    </div>
  )
}
