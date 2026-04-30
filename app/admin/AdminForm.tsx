'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Match = {
  id: string
  match_number: number
  match_time: string
  stage: string
  status: string
  home_score: number | null
  away_score: number | null
  home_team: { name: string; group_name: string }
  away_team: { name: string; group_name: string }
}

type Props = { matches: Match[] }

const STAGES = ['group', 'r32', 'r16', 'qf', 'sf', 'final']
const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter Finals', sf: 'Semi Finals', final: 'Final'
}

export default function AdminForm({ matches }: Props) {
  const supabase = createClient()

  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(() => {
    const init: Record<string, { home: string; away: string }> = {}
    for (const m of matches) {
      init[m.id] = {
        home: m.home_score !== null ? String(m.home_score) : '',
        away: m.away_score !== null ? String(m.away_score) : '',
      }
    }
    return init
  })

  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [activeStage, setActiveStage] = useState('group')

  async function saveResult(match: Match) {
    const v = scores[match.id]
    if (v.home === '' || v.away === '') return
    setSaving(match.id)

    const home_score = parseInt(v.home)
    const away_score = parseInt(v.away)

    await supabase
      .from('matches')
      .update({
        home_score,
        away_score,
        status: 'finished',
      })
      .eq('id', match.id)

    setSaved(s => ({ ...s, [match.id]: true }))
    setSaving(null)
    setTimeout(() => setSaved(s => ({ ...s, [match.id]: false })), 2000)
  }

  async function clearResult(matchId: string) {
    setSaving(matchId)
    await supabase
      .from('matches')
      .update({ home_score: null, away_score: null, status: 'scheduled' })
      .eq('id', matchId)

    setScores(s => ({ ...s, [matchId]: { home: '', away: '' } }))
    setSaving(null)
  }

  const stageMatches = matches.filter(m => m.stage === activeStage)

  const byDate: Record<string, Match[]> = {}
  for (const m of stageMatches) {
    const date = new Date(m.match_time).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
    })
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(m)
  }

  const finishedCount = stageMatches.filter(m => m.status === 'finished').length

  return (
    <div>
      {/* Stage tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {STAGES.map(s => (
          <button
            key={s}
            onClick={() => setActiveStage(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeStage === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-4">{finishedCount} / {stageMatches.length} results entered</p>

      {Object.keys(byDate).length === 0 && (
        <p className="text-gray-500 text-sm">No matches in this stage yet</p>
      )}

      <div className="space-y-6">
        {Object.entries(byDate).map(([date, dayMatches]) => (
          <div key={date}>
            <h2 className="text-green-400 text-sm font-semibold mb-2">{date}</h2>
            <div className="space-y-2">
              {dayMatches.map(match => {
                const v = scores[match.id]
                const isSaving = saving === match.id
                const isSaved = saved[match.id]
                const hasResult = match.status === 'finished'

                return (
                  <div key={match.id} className={`bg-gray-900 rounded-xl border px-4 py-3 ${hasResult ? 'border-green-800' : 'border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        #{match.match_number}
                        {match.stage === 'group' && ` · Group ${match.home_team.group_name}`}
                      </span>
                      {hasResult && (
                        <button
                          onClick={() => clearResult(match.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm font-medium truncate">{match.home_team.name}</span>
                      <input
                        type="number" min="0" max="20"
                        value={v.home}
                        onChange={e => setScores(s => ({ ...s, [match.id]: { ...s[match.id], home: e.target.value } }))}
                        onBlur={() => saveResult(match)}
                        className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500"
                      />
                      <span className="text-gray-500 text-sm">:</span>
                      <input
                        type="number" min="0" max="20"
                        value={v.away}
                        onChange={e => setScores(s => ({ ...s, [match.id]: { ...s[match.id], away: e.target.value } }))}
                        onBlur={() => saveResult(match)}
                        className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500"
                      />
                      <span className="flex-1 text-sm font-medium truncate text-right">{match.away_team.name}</span>
                    </div>
                    {(isSaving || isSaved) && (
                      <div className="text-xs mt-1.5 text-right">
                        {isSaving ? <span className="text-gray-500">saving...</span> : <span className="text-green-400">✓ saved</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
