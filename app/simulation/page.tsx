export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AuthGuard from '@/components/AuthGuard'
import SimulationClient from './SimulationClient'

export default async function SimulationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, group_name')
    .order('group_name')

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('id, match_number, home_team_id, away_team_id, match_time, stage')
    .eq('stage', 'group')
    .order('match_number')

  // Load user's saved simulation
  const { data: savedSim } = user ? await supabase
    .from('simulation_results')
    .select('match_id, home_score, away_score')
    .eq('user_id', user.id) : { data: [] }

  const savedMap: Record<string, { home: number; away: number }> = {}
  for (const s of savedSim ?? []) {
    savedMap[s.match_id] = { home: s.home_score, away: s.away_score }
  }

  const matches = (matchesRaw ?? []).map(m => ({
    ...m,
    home_score: savedMap[m.id]?.home ?? null,
    away_score: savedMap[m.id]?.away ?? null,
    status: 'scheduled',
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <AuthGuard />
      <h1 className="text-xl font-bold mb-1">🔮 Simulation</h1>
      <p className="text-gray-500 text-sm mb-6">Simulate the tournament — your results are saved automatically</p>
      <SimulationClient teams={teams ?? []} matches={matches ?? []} userId={user?.id ?? ''} />
    </main>
  )
}
