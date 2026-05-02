'use client'

import { useState, useMemo, useCallback } from 'react'
import { calcGroupStandings, getBestThird } from '@/lib/simulation/groupLogic'
import { SimMatch, MatchResult } from '@/lib/simulation/types'
import BracketView from './BracketView'
import { createClient } from '@/lib/supabase/client'

type Props = {
  teams: { id: string; name: string; group_name: string }[]
  matches: {
    id: string; match_number: number
    home_team_id: string; away_team_id: string
    match_time: string; home_score: number | null; away_score: number | null
    status: string; stage: string
  }[]
  userId: string
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function SimulationClient({ teams, matches, userId }: Props) {
  const teamMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const t of teams) m[t.id] = t.name
    return m
  }, [teams])

  const groupTeams = useMemo(() => {
    const g: Record<string, string[]> = {}
    for (const t of teams) {
      if (!g[t.group_name]) g[t.group_name] = []
      g[t.group_name].push(t.id)
    }
    return g
  }, [teams])

  const [results, setResults] = useState<Record<string, MatchResult>>(() => {
    const init: Record<string, MatchResult> = {}
    for (const m of matches) {
      init[m.id] = {
        home: m.home_score ?? null,
        away: m.away_score ?? null,
      }
    }
    return init
  })

  const [activeGroup, setActiveGroup] = useState('A')

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  async function saveSimulation() {
    if (!userId) {
      console.log('No userId, cannot save')
      return
    }
    console.log('Saving for userId:', userId)
    setSaving(true)
    const supabase = createClient()
    const upserts = Object.entries(results)
      .filter(([, r]) => r.home !== null && r.away !== null)
      .map(([match_id, r]) => ({
        user_id: userId,
        match_id,
        home_score: r.home!,
        away_score: r.away!,
      }))
    if (upserts.length > 0) {
      await supabase.from('simulation_results').upsert(upserts, { onConflict: 'user_id,match_id' })
    }
    setSaving(false)
    setLastSaved(new Date())
  }

  function fillRandom() {
    setResults(r => {
      const updated = { ...r }
      for (const m of matches) {
        if (updated[m.id]?.home === null || updated[m.id]?.away === null) {
          // ממוצע 3 שערים למשחק, מקסימום 5 לכל קבוצה
          const total = Math.random() < 0.6 ? 3 : Math.random() < 0.7 ? 2 : Math.random() < 0.5 ? 4 : 1
          const home = Math.min(5, Math.floor(Math.random() * (total + 1)))
          const away = Math.min(5, total - home)
          updated[m.id] = { home, away }
        }
      }
      return updated
    })
  }

  function clearAll() {
    setResults(r => {
      const updated = { ...r }
      for (const m of matches) {
        if (m.status !== 'finished') {
          updated[m.id] = { home: null, away: null }
        }
      }
      return updated
    })
  }

  const simMatches: SimMatch[] = useMemo(() =>
    matches.map(m => ({
      id: m.id,
      matchNumber: m.match_number,
      homeTeamId: m.home_team_id,
      awayTeamId: m.away_team_id,
      result: results[m.id] ?? { home: null, away: null },
      locked: m.status === 'finished',
    })), [matches, results])

  const groupMatches = useMemo(() => {
    const g: Record<string, SimMatch[]> = {}
    for (const m of simMatches) {
      const team = teams.find(t => t.id === m.homeTeamId)
      const grp = team?.group_name ?? ''
      if (!g[grp]) g[grp] = []
      g[grp].push(m)
    }
    return g
  }, [simMatches, teams])

  const allStandings = useMemo(() => {
    const s: Record<string, ReturnType<typeof calcGroupStandings>> = {}
    for (const grp of GROUPS) {
      s[grp] = calcGroupStandings(groupTeams[grp] ?? [], teamMap, groupMatches[grp] ?? [])
    }
    return s
  }, [groupTeams, teamMap, groupMatches])

  const bestThirds = useMemo(() => getBestThird(allStandings), [allStandings])

  function setScore(matchId: string, side: 'home' | 'away', val: string) {
    const num = val === '' ? null : parseInt(val)
    setResults(r => ({ ...r, [matchId]: { ...r[matchId], [side]: isNaN(num!) ? null : num } }))
  }

  const filledCount = Object.values(results).filter(r => r.home !== null && r.away !== null).length
  const totalCount = matches.length

  const [knockoutResults, setKnockoutResults] = useState<Record<number, { home: number | null; away: number | null }>>({})

  function handleKnockoutResult(matchNum: number, side: 'home' | 'away', val: string) {
    const num = val === '' ? null : parseInt(val)
    setKnockoutResults(r => ({ ...r, [matchNum]: { ...r[matchNum], [side]: isNaN(num!) ? null : num } }))
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex gap-2 mb-2">
        <button onClick={fillRandom} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 rounded-lg transition-colors">
          🎲 Fill Random
        </button>
        <button onClick={clearAll} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 rounded-lg transition-colors">
          🗑 Clear
        </button>
        <button onClick={saveSimulation} disabled={saving} className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors">
          {saving ? '...' : '💾 Save'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        {filledCount} / {totalCount} matches entered
        {lastSaved && <span className="ml-2 text-green-500">· Saved {lastSaved.toLocaleTimeString()}</span>}
      </p>

      {/* All groups */}
      {GROUPS.map(grp => {
        const grpMatches = groupMatches[grp] ?? []
        const grpStandings = allStandings[grp] ?? []
        return (
          <div key={grp} className="mb-8">
            <h2 className="text-green-400 font-bold text-base mb-3">Group {grp}</h2>

            {/* Standings */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 mb-3 overflow-hidden">
              <div className="bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-400 flex">
                <span className="w-5 mr-2"></span>
                <span className="flex-1">Team</span>
                <span className="w-10 text-center">P</span>
                <span className="w-10 text-center">GD</span>
                <span className="w-10 text-center">Pts</span>
              </div>
              {grpStandings.map((s, i) => {
                const qualifiedThird = bestThirds.find(t => t.teamId === s.teamId)
                const advances = i < 2 || !!qualifiedThird
                return (
                  <div key={s.teamId} className={`px-3 py-2 text-sm flex items-center border-t border-gray-800 ${advances ? '' : 'opacity-50'}`}>
                    <span className={`w-5 text-xs font-bold mr-2 ${i === 0 ? 'text-green-400' : i === 1 ? 'text-blue-400' : i === 2 && qualifiedThird ? 'text-yellow-400' : 'text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="w-10 text-center text-gray-400">{s.played}</span>
                    <span className="w-10 text-center text-gray-400">{s.gd > 0 ? `+${s.gd}` : s.gd}</span>
                    <span className="w-10 text-center font-bold">{s.points}</span>
                  </div>
                )
              })}
            </div>

            {/* Matches */}
            <div className="space-y-2">
              {grpMatches.map(m => (
                <div key={m.id} className={`bg-gray-900 rounded-xl border px-4 py-3 ${m.locked ? 'border-gray-700 opacity-70' : 'border-gray-800'}`}>
                  <div className="text-xs text-gray-500 mb-2">#{m.matchNumber}</div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-medium truncate">{teamMap[m.homeTeamId]}</span>
                    <input
                      type="number" min="0" max="20"
                      disabled={m.locked}
                      value={results[m.id]?.home ?? ''}
                      onChange={e => setScore(m.id, 'home', e.target.value)}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500 disabled:opacity-40"
                    />
                    <span className="text-gray-500 text-sm">:</span>
                    <input
                      type="number" min="0" max="20"
                      disabled={m.locked}
                      value={results[m.id]?.away ?? ''}
                      onChange={e => setScore(m.id, 'away', e.target.value)}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500 disabled:opacity-40"
                    />
                    <span className="flex-1 text-sm font-medium truncate text-right">{teamMap[m.awayTeamId]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Best thirds summary */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3 text-yellow-400">🏅 Best 3rd Place Teams</h3>
        {bestThirds.length === 0 ? (
          <p className="text-gray-500 text-sm">Enter results to see qualified third-place teams</p>
        ) : (
          <div className="space-y-1">
            {bestThirds.map((t, i) => (
              <div key={t.teamId} className="flex items-center text-sm">
                <span className="text-gray-500 w-5">{i + 1}.</span>
                <span className="flex-1">{t.standing.name}</span>
                <span className="text-gray-500 text-xs">Group {t.fromGroup}</span>
                <span className="ml-3 font-bold w-6 text-right">{t.standing.points}pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Knockout Bracket */}
      {filledCount > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">🏆 Knockout Stage</h2>
          <BracketView
            allStandings={allStandings}
            teamMap={teamMap}
            knockoutResults={knockoutResults}
            onKnockoutResult={handleKnockoutResult}
          />
        </div>
      )}
    </div>
  )
}
