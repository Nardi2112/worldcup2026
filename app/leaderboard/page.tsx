export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Points per stage
function matchPoints(predHome: number, predAway: number, realHome: number, realAway: number, stage: string): number {
  const isKnockout = stage !== 'group'
  const dirPts = isKnockout ? 5 : 3
  const exactBonus = isKnockout ? 5 : 3

  const predDir = predHome > predAway ? 'H' : predHome < predAway ? 'A' : 'D'
  const realDir = realHome > realAway ? 'H' : realHome < realAway ? 'A' : 'D'

  if (predHome === realHome && predAway === realAway) return dirPts + exactBonus
  if (predDir === realDir) return dirPts
  return 0
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // auth handled client-side

  const [
    { data: matches },
    { data: predictions },
    { data: profiles },
    { data: bonusPredictions },
    { data: tournamentResults },
  ] = await Promise.all([
    supabase.from('matches').select('id, home_score, away_score, stage').not('home_score', 'is', null),
    supabase.from('predictions').select('user_id, match_id, predicted_home, predicted_away'),
    supabase.from('profiles').select('id, display_name'),
    supabase.from('bonus_predictions').select('user_id, type, value, group_name'),
    supabase.from('tournament_results').select('type, value, group_name'),
  ])

  // results map
  const resultsMap: Record<string, { home: number; away: number; stage: string }> = {}
  for (const m of matches ?? []) {
    if (m.home_score !== null && m.away_score !== null) {
      resultsMap[m.id] = { home: m.home_score, away: m.away_score, stage: m.stage }
    }
  }

  // tournament results map
  const trMap: Record<string, string> = {}
  for (const tr of tournamentResults ?? []) {
    const key = tr.group_name ? `${tr.type}_${tr.group_name}` : tr.type
    trMap[key] = tr.value
  }

  // calculate points per user
  const userStats: Record<string, {
    groupPts: number; knockoutPts: number; bonusPts: number
    exact: number; correct: number; played: number
  }> = {}

  function getStats(uid: string) {
    if (!userStats[uid]) userStats[uid] = { groupPts: 0, knockoutPts: 0, bonusPts: 0, exact: 0, correct: 0, played: 0 }
    return userStats[uid]
  }

  // match predictions
  for (const pred of predictions ?? []) {
    const result = resultsMap[pred.match_id]
    if (!result) continue
    const pts = matchPoints(pred.predicted_home, pred.predicted_away, result.home, result.away, result.stage)
    const s = getStats(pred.user_id)
    const isKnockout = result.stage !== 'group'
    if (isKnockout) s.knockoutPts += pts
    else s.groupPts += pts
    s.played++
    if (pts === 6 || pts === 10) s.exact++
    else if (pts === 3 || pts === 5) s.correct++
  }

  // bonus predictions
  for (const bp of bonusPredictions ?? []) {
    const s = getStats(bp.user_id)
    const key = bp.group_name ? `${bp.type}_${bp.group_name}` : bp.type
    const actual = trMap[key]
    if (!actual) continue

    if (bp.value === actual) {
      if (bp.type === 'champion') s.bonusPts += 15
      else if (bp.type === 'finalist') s.bonusPts += 10
      else if (bp.type === 'top_scorer') s.bonusPts += 15
      else if (bp.type === 'most_goals') s.bonusPts += 7
      else if (bp.type === 'most_conceded') s.bonusPts += 7
      else if (bp.type === 'group_top2') s.groupPts += 5  // part of group stage
    }
  }

  const finishedCount = Object.keys(resultsMap).length
  const bonusAvailable = Object.keys(trMap).length > 0

  const leaderboard = (profiles ?? [])
    .map(p => {
      const s = userStats[p.id] ?? { groupPts: 0, knockoutPts: 0, bonusPts: 0, exact: 0, correct: 0, played: 0 }
      return {
        id: p.id,
        name: p.display_name,
        ...s,
        total: s.groupPts + s.knockoutPts + s.bonusPts,
        isMe: p.id === user?.id,
      }
    })
    .sort((a, b) => b.total - a.total || b.exact - a.exact)

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">🏅 Leaderboard</h1>
      <p className="text-gray-500 text-sm mb-6">{finishedCount} matches played</p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-4">
        <div className="bg-gray-800 px-4 py-2 flex text-xs font-semibold text-gray-400">
          <span className="w-6">#</span>
          <span className="flex-1">Player</span>
          <span className="w-12 text-center">Group</span>
          <span className="w-10 text-center">KO</span>
          <span className="w-12 text-center">Bonus</span>
          <span className="w-12 text-right font-bold">Total</span>
        </div>

        {leaderboard.map((entry, i) => (
          <div
            key={entry.id}
            className={`px-4 py-3 flex items-center border-t border-gray-800 ${entry.isMe ? 'bg-green-900/20' : ''}`}
          >
            <span className={`w-6 text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
              {i + 1}
            </span>
            <span className={`flex-1 text-sm truncate ${entry.isMe ? 'text-green-400 font-semibold' : ''}`}>
              {entry.name}{entry.isMe ? ' (you)' : ''}
            </span>
            <span className="w-12 text-center text-xs text-gray-300">{entry.groupPts}</span>
            <span className="w-10 text-center text-xs text-blue-400">{entry.knockoutPts || '-'}</span>
            <span className="w-12 text-center text-xs text-yellow-400">{entry.bonusPts || '-'}</span>
            <span className="w-12 text-right font-bold text-green-400">{entry.total}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p>Match = group stage pts · KO = knockout pts · ★ = bonus pts</p>
      </div>
    </main>
  )
}
