'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Match = {
  id: string
  match_time: string
  match_number: number
  venue: string
  city: string
  home_team: { name: string; group_name: string }
  away_team: { name: string; group_name: string }
}

type Props = {
  matches: Match[]
  predictions: Record<string, { home: number; away: number }>
}

export default function PredictForm({ matches, predictions }: Props) {
  const [values, setValues] = useState<Record<string, { home: string; away: string }>>(() => {
    const init: Record<string, { home: string; away: string }> = {}
    for (const m of matches) {
      const p = predictions[m.id]
      init[m.id] = { home: p ? String(p.home) : '', away: p ? String(p.away) : '' }
    }
    return init
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  async function savePrediction(matchId: string) {
    const v = values[matchId]
    if (v.home === '' || v.away === '') return
    setSaving(matchId)

    await supabase.from('predictions').upsert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      match_id: matchId,
      predicted_home: parseInt(v.home),
      predicted_away: parseInt(v.away),
    }, { onConflict: 'user_id,match_id' })

    setSaved(s => ({ ...s, [matchId]: true }))
    setSaving(null)
    setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
  }

  // group by date
  const byDate: Record<string, Match[]> = {}
  for (const m of matches) {
    const date = new Date(m.match_time).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
    })
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(m)
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          <h2 className="text-green-400 text-sm font-semibold mb-2">{date}</h2>
          <div className="space-y-2">
            {dayMatches.map(match => {
              const locked = new Date(match.match_time).getTime() - 5 * 60 * 1000 <= now.getTime()
              const v = values[match.id]
              const isSaving = saving === match.id
              const isSaved = saved[match.id]

              return (
                <div key={match.id} className={`bg-gray-900 rounded-xl border px-4 py-3 ${locked ? 'border-gray-700 opacity-60' : 'border-gray-800'}`}>
                  <div className="text-xs text-gray-500 mb-2">
                    #{match.match_number} · Group {match.home_team.group_name} · {new Date(match.match_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {match.venue}, {match.city}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-medium truncate">{match.home_team.name}</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      disabled={locked}
                      value={v.home}
                      onChange={e => setValues(s => ({ ...s, [match.id]: { ...s[match.id], home: e.target.value } }))}
                      onBlur={() => savePrediction(match.id)}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500 disabled:opacity-40"
                    />
                    <span className="text-gray-500 text-sm">:</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      disabled={locked}
                      value={v.away}
                      onChange={e => setValues(s => ({ ...s, [match.id]: { ...s[match.id], away: e.target.value } }))}
                      onBlur={() => savePrediction(match.id)}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500 disabled:opacity-40"
                    />
                    <span className="flex-1 text-sm font-medium truncate text-right">{match.away_team.name}</span>
                  </div>
                  {(isSaving || isSaved) && (
                    <div className="text-xs mt-1.5 text-right">
                      {isSaving ? <span className="text-gray-500">saving...</span> : <span className="text-green-400">✓ saved</span>}
                    </div>
                  )}
                  {locked && <div className="text-xs text-red-400 mt-1">Locked</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
