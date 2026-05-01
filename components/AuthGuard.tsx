'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthGuard() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthGuard session:', session ? 'found' : 'null')
      if (!session) {
        window.location.href = '/auth'
      }
    })
  }, [])
  return null
}
