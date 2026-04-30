export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@worldcup2026.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  if (user.email !== ADMIN_EMAIL) redirect('/')

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_number, match_time, stage, home_score, away_score, status,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `)
    .order('match_number')

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">⚙️ Admin — Match Results</h1>
      <p className="text-gray-500 text-sm mb-6">Enter actual match scores</p>
      <AdminClient matches={matches ?? []} />
    </main>
  )
}
