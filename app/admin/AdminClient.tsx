'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Match = {
  id: string
  match_number: number
  match_time: string
  stage: string
  home_score: number | null
  away_score: number | null
  status: string
  home_team: { name: string } | null
  away_team: { name: string } | null
}

const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter Finals',
  semi_final: 'Semi Finals',
  third_place: 'Third Place',
  final: 'Final',
}

export default function AdminClient({ matches }: { matches: Match[] }) {
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending')

  async function saveResult(matchId: string) {
    const s = scores[matchId]
    if (s.home === '' || s.away === '') return
    setSaving(matchId)

    await supabase.from('matches').update({
      home_score: parseInt(s.home),
      away_score: parseInt(s.away),
      status: 'finished',
    }).eq('id', matchId)

    setSaved(prev => ({ ...prev, [matchId]: true }))
    setSaving(null)
    setTimeout(() => setSaved(prev => ({ ...prev, [matchId]: false })), 2000)
  }

  const byStage: Record<string, Match[]> = {}
  for (const m of matches) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage].push(m)
  }

  const stageOrder = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']

  function shouldShow(m: Match) {
    if (filter === 'all') return true
    if (filter === 'pending') return m.status !== 'finished'
    if (filter === 'done') return m.status === 'finished'
    return true
  }

  return (
    <div>
      {/* filter */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'done', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {stageOrder.filter(s => byStage[s]?.some(shouldShow)).map(stage => (
          <div key={stage}>
            <h2 className="text-green-400 font-semibold text-sm mb-2">{STAGE_LABELS[stage]}</h2>
            <div className="space-y-2">
              {byStage[stage]?.filter(shouldShow).map(match => (
                <div key={match.id} className={`bg-gray-900 rounded-xl border px-4 py-3 ${match.status === 'finished' ? 'border-green-800' : 'border-gray-800'}`}>
                  <div className="text-xs text-gray-500 mb-2">#{match.match_number}</div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm truncate">{match.home_team?.name ?? '?'}</span>
                    <input type="number" min="0" max="20"
                      value={scores[match.id]?.home ?? ''}
                      onChange={e => setScores(s => ({ ...s, [match.id]: { ...s[match.id], home: e.target.value } }))}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500"
                    />
                    <span className="text-gray-500">:</span>
                    <input type="number" min="0" max="20"
                      value={scores[match.id]?.away ?? ''}
                      onChange={e => setScores(s => ({ ...s, [match.id]: { ...s[match.id], away: e.target.value } }))}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500"
                    />
                    <span className="flex-1 text-sm truncate text-right">{match.away_team?.name ?? '?'}</span>
                    <button
                      onClick={() => saveResult(match.id)}
                      disabled={saving === match.id}
                      className="ml-2 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {saving === match.id ? '...' : saved[match.id] ? '✓' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
