import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAuth } from '../_lib/auth'
import { cors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'GET') {
      // Get current user's donations
      const user = await requireAuth(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, data)
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Donations/me error:', e)
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
