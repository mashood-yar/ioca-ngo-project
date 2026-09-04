import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { sendVolunteerNotification, sendVolunteerAutoresponder } from '../_lib/email'

const volunteerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  availability: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
})

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']),
  admin_notes: z.string().optional().nullable(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []
  const id = segments[0] === 'index' ? undefined : segments[0]

  try {
    if (req.method === 'POST' && !id) {
      const validated = volunteerSchema.parse(req.body)
      const { data, error } = await supabase
        .from('volunteers')
        .insert({
          full_name: validated.full_name,
          email: validated.email,
          phone: validated.phone || null,
          city: validated.city || null,
          availability: validated.availability || null,
          skills: validated.skills || null,
          motivation: validated.motivation || null,
          status: 'pending',
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      try {
        await Promise.all([
          sendVolunteerNotification(validated.full_name, validated.email, validated.city, validated.skills),
          sendVolunteerAutoresponder(validated.full_name, validated.email)
        ])
      } catch (e) {
        console.error('Failed to send volunteer emails:', e)
      }

      return ok(res, data, 201)
    }

    if (req.method === 'GET' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return
      const status = req.query.status as string | undefined
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      let query = supabase.from('volunteers').select('*', { count: 'exact' })
      if (status) query = query.eq('status', status)
      const from = (page - 1) * limit
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1)
      if (error) throw new Error(error.message)
      return ok(res, {
        volunteers: data,
        meta: { total: count || 0, page, limit, totalPages: count ? Math.ceil(count / limit) : 0 }
      })
    }

    if (req.method === 'GET' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return
      const { data, error } = await supabase.from('volunteers').select('*').eq('id', id).single()
      if (error) {
        if (error.code === 'PGRST116') return err(res, 'Volunteer not found', 404)
        throw new Error(error.message)
      }
      return ok(res, data)
    }

    if (req.method === 'PATCH' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return
      const { status, admin_notes } = updateStatusSchema.parse(req.body)
      const { data, error } = await supabase
        .from('volunteers')
        .update({ status, admin_notes: admin_notes ?? null, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return
      const { error } = await supabase.from('volunteers').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return ok(res, { deleted: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Volunteers API error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}