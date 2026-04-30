'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfileClient({ displayName }: { displayName: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim()) return
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: name.trim() })
      .eq('id', user.id)

    if (err) { setError(err.message); setSaving(false); return }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <label className="text-xs text-gray-400 mb-2 block">Display Name (nickname)</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your nickname"
          maxLength={30}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <p className="text-xs text-gray-600 mt-2">This is how you appear on leaderboards</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={save} disabled={saving || !name.trim()}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
      </button>

      <button onClick={signOut}
        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold py-3 rounded-xl transition-colors mt-8">
        Sign Out
      </button>
    </div>
  )
}
