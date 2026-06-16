import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'

const updateContactStatusSchema = z.object({
  status: z.enum(['unread', 'read', 'replied']),
  adminNotes: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { id } = req.query
  if (!id || Array.isArray(id)) {
    return err(res, 'Invalid contact ID', 400)
  }

  try {
    if (req.method === 'GET') {
      // Admin endpoint: get single contact
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Contact not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, data)
    } else if (req.method === 'PATCH') {
      // Admin endpoint: update contact status
      const user = await requireAdmin(req, res)
      if (!user) return

      const { status, adminNotes } = updateContactStatusSchema.parse(req.body)

      const updateData: Record<string, unknown> = { status }
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes
      }

      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    } else if (req.method === 'DELETE') {
      // Admin endpoint: delete contact
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Contact deleted' })
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error(`Contact [${id}] error:`, e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
