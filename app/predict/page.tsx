export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import PredictForm from './PredictForm'

export default async function PredictPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_time, match_number, venue, city,
      home_team:teams!matches_home_team_id_fkey(name, group_name),
      away_team:teams!matches_away_team_id_fkey(name, group_name)
    `)
    .eq('stage', 'group')
    .order('match_time')

  const { data: existingPredictions } = await supabase
    .from('predictions')
    .select('match_id, predicted_home, predicted_away')
    .eq('user_id', user.id)

  const predictionsMap: Record<string, { home: number; away: number }> = {}
  for (const p of existingPredictions ?? []) {
    predictionsMap[p.match_id] = { home: p.predicted_home, away: p.predicted_away }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">🎯 Predict Matches</h1>
      <PredictForm matches={(matches ?? []) as any} predictions={predictionsMap} />
    </main>
  )
}
