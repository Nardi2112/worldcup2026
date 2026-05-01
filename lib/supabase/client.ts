import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton to avoid multiple instances
let _client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (_client) return _client
  _client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}
