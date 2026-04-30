export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('group_name')

  const groups: Record<string, typeof teams> = {}
  for (const team of teams ?? []) {
    if (!groups[team.group_name]) groups[team.group_name] = []
    groups[team.group_name]!.push(team)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">⚽ Groups</h1>
      <div className="space-y-4">
        {Object.entries(groups).map(([group, groupTeams]) => (
          <div key={group} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-green-700 px-4 py-2 font-bold text-sm">Group {group}</div>
            <div className="divide-y divide-gray-800">
              {groupTeams!.map(team => (
                <div key={team.id} className="px-4 py-2.5 text-sm">{team.name}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
