import { createClient } from '@supabase/supabase-js'

let _supabase: any = null

function initSupabase() {
  if (_supabase) return _supabase
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(`Missing environment variables. SUPABASE_URL: ${url ? 'present' : 'missing'}, SUPABASE_SERVICE_ROLE_KEY: ${key ? 'present' : 'missing'}`)
  }
  _supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return _supabase
}

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return initSupabase()[prop]
  }
})
