export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Countdown from '@/components/Countdown'
import AuthGuard from '@/components/AuthGuard'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = user ? await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single().then(r => r.data) : null

  // quick stats
  const { count: predictedCount } = user ? await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id) : { count: 0 }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <AuthGuard />
      {/* Hero */}
      <div className="bg-gradient-to-b from-green-900/40 to-gray-950 px-4 pt-10 pb-6 text-center">
        <div className="text-5xl mb-2">⚽</div>
        <h1 className="text-2xl font-bold mb-1">World Cup 2026</h1>
        <p className="text-gray-400 text-sm mb-4">Prediction Game</p>
        <Countdown targetDate="2026-06-11T19:00:00Z" />
      </div>

      {/* Welcome */}
      <div className="px-4 py-4 max-w-md mx-auto">
        <p className="text-gray-400 text-sm mb-4">
          Welcome back, <a href="/profile" className="text-white font-semibold hover:text-green-400">{profile?.display_name ?? user?.email}</a>
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{predictedCount ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Predictions made</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              —
            </div>
            <div className="text-xs text-gray-500 mt-1">Your rank</div>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <Link href="/predict" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-semibold text-sm">Predict Matches</div>
              <div className="text-gray-500 text-xs">Submit your score predictions</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>

          <Link href="/results" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-sm">Results</div>
              <div className="text-gray-500 text-xs">See how your predictions did</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>

          <Link href="/leaderboard" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">🏅</span>
            <div>
              <div className="font-semibold text-sm">Leaderboard</div>
              <div className="text-gray-500 text-xs">See how you rank</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>

          <Link href="/bonus" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="font-semibold text-sm">Tournament Predictions</div>
              <div className="text-gray-500 text-xs">Champion, top scorer & more</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>

          <Link href="/league" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">👥</span>
            <div>
              <div className="font-semibold text-sm">My Leagues</div>
              <div className="text-gray-500 text-xs">Play with friends & family</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>

          <Link href="/simulation" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">🔮</span>
            <div>
              <div className="font-semibold text-sm">Simulation</div>
              <div className="text-gray-500 text-xs">Simulate the tournament</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>

          <Link href="/how-to-play" className="flex items-center gap-4 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 active:opacity-70">
            <span className="text-2xl">📖</span>
            <div>
              <div className="font-semibold text-sm">How to Play</div>
              <div className="text-gray-500 text-xs">Scoring rules & leagues guide</div>
            </div>
            <span className="ml-auto text-gray-600">›</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
