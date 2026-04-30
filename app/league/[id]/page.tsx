export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

function calcPoints(predHome: number, predAway: number, realHome: number, realAway: number, stage: string): number {
  const isKnockout = stage !== 'group'
  const dirPts = isKnockout ? 5 : 3
  const exactBonus = isKnockout ? 5 : 3
  const predDir = predHome > predAway ? 'H' : predHome < predAway ? 'A' : 'D'
  const realDir = realHome > realAway ? 'H' : realHome < realAway ? 'A' : 'D'
  if (predHome === realHome && predAway === realAway) return dirPts + exactBonus
  if (predDir === realDir) return dirPts
  return 0
}

export default async function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, invite_code')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // check membership
  const { data: membership } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/league')

  // get all members
  const { data: members } = await supabase
    .from('league_members')
    .select('user_id, profiles(id, display_name)')
    .eq('league_id', id)

  const memberIds = members?.map(m => m.user_id) ?? []
  const profileMap: Record<string, string> = {}
  for (const m of members ?? []) {
    if (m.profiles) profileMap[m.user_id] = (m.profiles as any).display_name
  }

  // get finished matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score, stage')
    .not('home_score', 'is', null)

  const resultsMap: Record<string, { home: number; away: number; stage: string }> = {}
  for (const m of matches ?? []) {
    if (m.home_score !== null && m.away_score !== null) {
      resultsMap[m.id] = { home: m.home_score, away: m.away_score, stage: m.stage }
    }
  }

  // get predictions for all members
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, match_id, predicted_home, predicted_away')
    .in('user_id', memberIds)

  const userPts: Record<string, number> = {}
  for (const pred of predictions ?? []) {
    const result = resultsMap[pred.match_id]
    if (!result) continue
    const pts = calcPoints(pred.predicted_home, pred.predicted_away, result.home, result.away, result.stage)
    userPts[pred.user_id] = (userPts[pred.user_id] ?? 0) + pts
  }

  const leaderboard = memberIds
    .map(uid => ({ uid, name: profileMap[uid] ?? 'Unknown', pts: userPts[uid] ?? 0, isMe: uid === user.id }))
    .sort((a, b) => b.pts - a.pts)

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <a href="/league" className="text-gray-400 text-sm mb-4 block">← My Leagues</a>
      <h1 className="text-xl font-bold mb-1">{league.name}</h1>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-500">Code:</span>
        <span className="font-mono font-bold text-green-400 tracking-widest">{league.invite_code}</span>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 flex text-xs font-semibold text-gray-400">
          <span className="w-6">#</span>
          <span className="flex-1">Player</span>
          <span className="w-16 text-right font-bold">Points</span>
        </div>
        {leaderboard.map((entry, i) => (
          <div key={entry.uid}
            className={`px-4 py-3 flex items-center border-t border-gray-800 ${entry.isMe ? 'bg-green-900/20' : ''}`}>
            <span className={`w-6 text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
              {i + 1}
            </span>
            <span className={`flex-1 text-sm ${entry.isMe ? 'text-green-400 font-semibold' : ''}`}>
              {entry.name}{entry.isMe ? ' (you)' : ''}
            </span>
            <span className="w-16 text-right font-bold text-green-400">{entry.pts}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-4 text-center">{leaderboard.length} players · Match points only</p>
    </main>
  )
}
