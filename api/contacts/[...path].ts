import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

const updateContactStatusSchema = z.object({
  status: z.enum(['unread', 'read', 'replied']),
  adminNotes: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const segments = (req.query.path as string[]) ?? []
  const id = segments[0]

  try {
    if (req.method === 'POST' && !id) {
      // Public endpoint: create contact
      const validatedData = contactSchema.parse(req.body)
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          name: validatedData.name,
          email: validatedData.email,
          message: validatedData.message,
          status: 'unread'
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data, 201)
    }

    if (req.method === 'GET' && !id) {
      // Admin endpoint: list all contacts
      const user = await requireAdmin(req, res)
      if (!user) return

      const status = req.query.status as string | undefined
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      let query = supabase.from('contacts').select('*', { count: 'exact' })

      if (status) {
        query = query.eq('status', status)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw new Error(error.message)

      return ok(res, {
        contacts: data,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: count ? Math.ceil(count / limit) : 0
        }
      })
    }

    if (req.method === 'GET' && id) {
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
    }

    if (req.method === 'PATCH' && id) {
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
    }

    if (req.method === 'DELETE' && id) {
      // Admin endpoint: delete contact
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Contact deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    console.error('Contacts error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}