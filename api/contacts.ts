import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from './_lib/supabase'
import { ok, err } from './_lib/response'
import { requireAdmin } from './_lib/auth'
import { cors } from './_lib/cors'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'POST') {
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
    } else if (req.method === 'GET') {
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
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Contacts error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
