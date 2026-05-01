export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">👤 My Profile</h1>
      <p className="text-gray-500 text-sm mb-6">{user.email}</p>
      <ProfileClient displayName={profile?.display_name ?? ''} />
    </main>
  )
}
