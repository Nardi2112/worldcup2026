export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import BonusForm from './BonusForm'

export default async function BonusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // auth handled client-side

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, group_name')
    .order('group_name')

  const { data: existing } = await supabase
    .from('bonus_predictions')
    .select('*')
    .eq('user_id', user?.id ?? '')

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">🏆 Tournament Predictions</h1>
      <p className="text-gray-500 text-sm mb-6">One-time bonus predictions — submit before the tournament starts</p>
      <BonusForm teams={teams ?? []} existing={existing ?? []} />
    </main>
  )
}
