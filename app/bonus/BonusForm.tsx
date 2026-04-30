'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Team = { id: string; name: string; group_name: string }
type Existing = { type: string; value: string; group_name: string | null }

type Props = {
  teams: Team[]
  existing: Existing[]
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function BonusForm({ teams, existing }: Props) {
  const supabase = createClient()

  function getExisting(type: string, group?: string) {
    return existing.find(e => e.type === type && (group ? e.group_name === group : true))?.value ?? ''
  }

  const [champion, setChampion] = useState(getExisting('champion'))
  const [finalist, setFinalist] = useState(getExisting('finalist'))
  const [topScorer, setTopScorer] = useState(getExisting('top_scorer'))
  const [mostGoals, setMostGoals] = useState(getExisting('most_goals'))
  const [mostConceded, setMostConceded] = useState(getExisting('most_conceded'))
  const [groupTop2, setGroupTop2] = useState<Record<string, [string, string]>>(() => {
    const init: Record<string, [string, string]> = {}
    for (const g of GROUPS) {
      const picks = existing.filter(e => e.type === 'group_top2' && e.group_name === g).map(e => e.value)
      init[g] = [picks[0] ?? '', picks[1] ?? '']
    }
    return init
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const upserts = []

    if (champion) upserts.push({ user_id: user.id, type: 'champion', value: champion, group_name: null })
    if (finalist) upserts.push({ user_id: user.id, type: 'finalist', value: finalist, group_name: null })
    if (topScorer) upserts.push({ user_id: user.id, type: 'top_scorer', value: topScorer, group_name: null })
    if (mostGoals) upserts.push({ user_id: user.id, type: 'most_goals', value: mostGoals, group_name: null })
    if (mostConceded) upserts.push({ user_id: user.id, type: 'most_conceded', value: mostConceded, group_name: null })

    for (const g of GROUPS) {
      const [p1, p2] = groupTop2[g]
      if (p1) upserts.push({ user_id: user.id, type: 'group_top2', value: p1, group_name: `${g}_1` })
      if (p2) upserts.push({ user_id: user.id, type: 'group_top2', value: p2, group_name: `${g}_2` })
    }

    await supabase.from('bonus_predictions').upsert(upserts, { onConflict: 'user_id,type,group_name' })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const groupedTeams = GROUPS.reduce((acc, g) => {
    acc[g] = teams.filter(t => t.group_name === g)
    return acc
  }, {} as Record<string, Team[]>)

  return (
    <div className="space-y-6">

      {/* אלופה */}
      <Section title="🥇 Champion" points={15}>
        <TeamSelect teams={teams} value={champion} onChange={setChampion} placeholder="Select champion" />
      </Section>

      {/* גמר */}
      <Section title="🥈 Runner-up (Finalist)" points={10}>
        <TeamSelect teams={teams} value={finalist} onChange={setFinalist} placeholder="Select finalist" />
      </Section>

      {/* מלך שערים */}
      <Section title="⚽ Top Scorer (Golden Boot)" points={15}>
        <select
          value={topScorer}
          onChange={e => setTopScorer(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500"
        >
          <option value="">Select player</option>
          <option>Cristiano Ronaldo (Portugal)</option>
          <option>Kylian Mbappé (France)</option>
          <option>Harry Kane (England)</option>
          <option>Lamine Yamal (Spain)</option>
          <option>Lionel Messi (Argentina)</option>
          <option>Erling Haaland (Norway)</option>
          <option>Vinicius Jr. (Brazil)</option>
          <option>Rodri (Spain)</option>
          <option>Pedri (Spain)</option>
          <option>Bukayo Saka (England)</option>
          <option>Phil Foden (England)</option>
          <option>Jude Bellingham (England)</option>
          <option>Raphinha (Brazil)</option>
          <option>Neymar (Brazil)</option>
          <option>Julian Alvarez (Argentina)</option>
          <option>Lautaro Martinez (Argentina)</option>
          <option>Florian Wirtz (Germany)</option>
          <option>Jamal Musiala (Germany)</option>
          <option>Dušan Vlahović (Serbia)</option>
          <option>Victor Osimhen (Nigeria)</option>
          <option>Romelu Lukaku (Belgium)</option>
          <option>Memphis Depay (Netherlands)</option>
          <option>Cody Gakpo (Netherlands)</option>
          <option>Christian Pulisic (USA)</option>
          <option>Richarlison (Brazil)</option>
          <option>Other</option>
        </select>
      </Section>

      {/* הכי הרבה שערים */}
      <Section title="🔥 Most Goals Scored (whole tournament)" points={7}>
        <TeamSelect teams={teams} value={mostGoals} onChange={setMostGoals} placeholder="Select team" />
      </Section>

      {/* הכי הרבה ספיגות */}
      <Section title="🚨 Most Goals Conceded (group stage)" points={7}>
        <TeamSelect teams={teams} value={mostConceded} onChange={setMostConceded} placeholder="Select team" />
      </Section>

      {/* 2 ראשונות בכל בית */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">📊 Top 2 per Group</h3>
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">5 pts each</span>
        </div>
        <div className="space-y-4">
          {GROUPS.map(g => (
            <div key={g}>
              <div className="text-xs text-gray-400 font-semibold mb-1.5">Group {g}</div>
              <div className="flex gap-2">
                <TeamSelect
                  teams={groupedTeams[g]}
                  value={groupTop2[g][0]}
                  onChange={v => setGroupTop2(prev => ({ ...prev, [g]: [v, prev[g][1]] }))}
                  placeholder="1st"
                  small
                />
                <TeamSelect
                  teams={groupedTeams[g]}
                  value={groupTop2[g][1]}
                  onChange={v => setGroupTop2(prev => ({ ...prev, [g]: [prev[g][0], v] }))}
                  placeholder="2nd"
                  small
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Predictions'}
      </button>
    </div>
  )
}

function Section({ title, points, children }: { title: string; points: number; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{points} pts</span>
      </div>
      {children}
    </div>
  )
}

function TeamSelect({ teams, value, onChange, placeholder, small }: {
  teams: Team[]; value: string; onChange: (v: string) => void
  placeholder: string; small?: boolean
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-green-500 ${small ? 'flex-1 px-2 py-2' : 'w-full px-4 py-3'}`}
    >
      <option value="">{placeholder}</option>
      {teams.map(t => (
        <option key={t.id} value={t.name}>{t.name}</option>
      ))}
    </select>
  )
}
