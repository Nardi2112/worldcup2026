export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import SimulationClient from './SimulationClient'

export default async function SimulationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // auth handled client-side

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, group_name')
    .order('group_name')

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('id, match_number, home_team_id, away_team_id, match_time, stage')
    .eq('stage', 'group')
    .order('match_number')

  // Strip scores so simulation starts empty
  const matches = (matchesRaw ?? []).map(m => ({
    ...m,
    home_score: null,
    away_score: null,
    status: 'scheduled',
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">🔮 Simulation</h1>
      <p className="text-gray-500 text-sm mb-6">Simulate the tournament — enter results and see who advances</p>
      <SimulationClient teams={teams ?? []} matches={matches ?? []} />
    </main>
  )
}
