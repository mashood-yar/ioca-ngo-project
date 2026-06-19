import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function getUser(req: VercelRequest): Promise<User | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<User | null> {
  const user = await getUser(req)
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return null
  }
  return user
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse
): Promise<User | null> {
  const user = await requireAuth(req, res)
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Forbidden' })
    return null
  }
  return user
}
