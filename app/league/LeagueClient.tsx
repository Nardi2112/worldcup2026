'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type League = { id: string; name: string; invite_code: string; created_by: string }

export default function LeagueClient({ leagues, userId }: { leagues: League[]; userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list')
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  function randomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async function createLeague() {
    if (!newName.trim()) return
    setLoading(true); setError('')
    const code = randomCode()
    const { data, error: err } = await supabase
      .from('leagues')
      .insert({ name: newName.trim(), invite_code: code, created_by: userId })
      .select()
      .single()

    if (err) {
      if (err.code === '23505') setError('A league with this name already exists. Choose a different name.')
      else setError(err.message)
      setLoading(false); return
    }

    await supabase.from('league_members').insert({ league_id: data.id, user_id: userId })
    setLoading(false)
    setMode('list')
    setNewName('')
    router.refresh()
  }

  async function joinLeague() {
    if (!joinCode.trim()) return
    setLoading(true); setError('')

    const { data: league, error: err } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .single()

    if (err || !league) { setError('League not found. Check the code and try again.'); setLoading(false); return }

    const { error: joinErr } = await supabase
      .from('league_members')
      .insert({ league_id: league.id, user_id: userId })

    if (joinErr) { setError('You may already be in this league.'); setLoading(false); return }

    setLoading(false)
    setMode('list')
    setJoinCode('')
    router.refresh()
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (mode === 'create') return (
    <div className="space-y-4">
      <button onClick={() => setMode('list')} className="text-gray-400 text-sm">← Back</button>
      <h2 className="font-semibold">Create a League</h2>
      <input
        type="text" placeholder="League name (e.g. Office 2026)"
        value={newName} onChange={e => setNewName(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={createLeague} disabled={loading || !newName.trim()}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
        {loading ? 'Creating...' : 'Create League'}
      </button>
    </div>
  )

  if (mode === 'join') return (
    <div className="space-y-4">
      <button onClick={() => setMode('list')} className="text-gray-400 text-sm">← Back</button>
      <h2 className="font-semibold">Join a League</h2>
      <input
        type="text" placeholder="Enter invite code (e.g. ABC123)"
        value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 uppercase tracking-widest"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={joinLeague} disabled={loading || !joinCode.trim()}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
        {loading ? 'Joining...' : 'Join League'}
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* action buttons */}
      <div className="flex gap-3">
        <button onClick={() => setMode('create')}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl text-sm">
          + Create League
        </button>
        <button onClick={() => setMode('join')}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm">
          Join League
        </button>
      </div>

      {/* leagues list */}
      {leagues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-sm">You're not in any leagues yet.</p>
          <p className="text-sm">Create one or join with an invite code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map(league => (
            <div key={league.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{league.name}</h3>
                  {league.created_by === userId && (
                    <span className="text-xs text-green-400">You created this</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500 mb-0.5">Invite Code</div>
                  <div className="font-mono font-bold tracking-widest text-white">{league.invite_code}</div>
                </div>
                <button
                  onClick={() => copyCode(league.invite_code)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  {copied === league.invite_code ? '✓' : '📋'}
                </button>
              </div>
              <a href={`/league/${league.id}`}
                className="mt-3 block text-center text-sm text-green-400 hover:text-green-300">
                View Leaderboard →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
