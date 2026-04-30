export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(name, group_name),
      away_team:teams!matches_away_team_id_fkey(name, group_name)
    `)
    .eq('stage', 'group')
    .order('match_time')

  // group by date
  const byDate: Record<string, typeof matches> = {}
  for (const match of matches ?? []) {
    const date = new Date(match.match_time).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
    })
    if (!byDate[date]) byDate[date] = []
    byDate[date]!.push(match)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">📅 Group Stage Matches</h1>
      <div className="space-y-6">
        {Object.entries(byDate).map(([date, dayMatches]) => (
          <div key={date}>
            <h2 className="text-green-400 text-sm font-semibold mb-2">{date}</h2>
            <div className="space-y-2">
              {dayMatches!.map(match => {
                const time = new Date(match.match_time).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
                })
                return (
                  <div key={match.id} className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex-1 font-medium">{match.home_team.name}</span>
                      <span className="text-gray-500 text-xs px-2">vs</span>
                      <span className="flex-1 text-right font-medium">{match.away_team.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Group {match.home_team.group_name} · {time} UTC · {match.venue}, {match.city}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
