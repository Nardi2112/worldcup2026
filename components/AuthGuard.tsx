'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthGuard() {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (checked) return
      setChecked(true)
      if (!session) {
        window.location.href = '/auth'
      }
    })

    // Also check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (checked) return
      setChecked(true)
      if (!session) {
        window.location.href = '/auth'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
