export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import LeagueClient from './LeagueClient'

export default async function LeaguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // auth handled client-side

  // get leagues the user is in
  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id, leagues(id, name, invite_code, created_by)')
    .eq('user_id', user?.id ?? '')

  const leagues = memberships?.map(m => m.leagues).filter(Boolean) ?? []

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">👥 My Leagues</h1>
      <p className="text-gray-500 text-sm mb-6">Play with friends, family or colleagues</p>
      <LeagueClient leagues={leagues as any} userId={user?.id ?? ''} />
    </main>
  )
}
