export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_number, match_time, stage, home_score, away_score, status,
      home_team:teams!matches_home_team_id_fkey(name, group_name),
      away_team:teams!matches_away_team_id_fkey(name, group_name)
    `)
    .not('home_score', 'is', null)
    .order('match_number')

  const { data: myPredictions } = await supabase
    .from('predictions')
    .select('match_id, predicted_home, predicted_away')
    .eq('user_id', user.id)

  const predMap: Record<string, { home: number; away: number }> = {}
  for (const p of myPredictions ?? []) {
    predMap[p.match_id] = { home: p.predicted_home, away: p.predicted_away }
  }

  // group by stage
  const byStage: Record<string, typeof matches> = {}
  for (const m of matches ?? []) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage]!.push(m)
  }

  const stageOrder = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']
  const stageLabels: Record<string, string> = {
    group: 'Group Stage',
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarter_final: 'Quarter Finals',
    semi_final: 'Semi Finals',
    third_place: 'Third Place',
    final: 'Final',
  }

  let totalPts = 0

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">📊 Results</h1>
      <p className="text-gray-500 text-sm mb-6">Your predictions vs actual results</p>

      <div className="space-y-6">
        {stageOrder.filter(s => byStage[s]?.length).map(stage => (
          <div key={stage}>
            <h2 className="text-green-400 font-semibold text-sm mb-2">{stageLabels[stage]}</h2>
            <div className="space-y-2">
              {byStage[stage]!.map(match => {
                const pred = predMap[match.id]
                const pts = pred
                  ? calcPoints(pred.home, pred.away, match.home_score!, match.away_score!, match.stage)
                  : null
                if (pts !== null) totalPts += pts

                return (
                  <div key={match.id} className={`bg-gray-900 rounded-xl border px-4 py-3 ${
                    pts === null ? 'border-gray-800 opacity-60' :
                    pts >= 6 ? 'border-green-700' :
                    pts >= 3 ? 'border-blue-800' :
                    'border-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 text-sm">
                      {/* home team */}
                      <span className="flex-1 truncate text-xs">{(match.home_team as any)?.name}</span>

                      {/* actual result */}
                      <div className="flex items-center gap-1">
                        <span className="text-white font-bold">{match.home_score}</span>
                        <span className="text-gray-500">:</span>
                        <span className="text-white font-bold">{match.away_score}</span>
                      </div>

                      {/* away team */}
                      <span className="flex-1 text-right truncate text-xs">{(match.away_team as any)?.name}</span>
                    </div>

                    {/* prediction row */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-500">
                        {pred
                          ? `Your pick: ${pred.home}–${pred.away}`
                          : 'No prediction'
                        }
                      </span>
                      {pts !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          pts >= 6 ? 'bg-green-500/20 text-green-400' :
                          pts >= 3 ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-800 text-gray-500'
                        }`}>
                          {pts > 0 ? `+${pts}` : '0'} pts
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
        <div className="text-gray-400 text-sm">Total from results</div>
        <div className="text-2xl font-bold text-green-400 mt-1">{totalPts} pts</div>
      </div>
    </main>
  )
}
