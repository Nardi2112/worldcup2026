'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthGuard() {
  useEffect(() => {
    const supabase = createClient()
    let redirected = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !redirected) {
        redirected = true
        window.location.href = '/auth'
      }
    })
  }, [])

  return null
}
