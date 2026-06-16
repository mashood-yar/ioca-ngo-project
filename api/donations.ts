import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from './_lib/supabase'
import { ok, err } from './_lib/response'
import { getUser, requireAdmin } from './_lib/auth'
import { cors } from './_lib/cors'

const donationSchema = z.object({
  donorName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.string(),
  screenshotUrl: z.string().url().optional(),
  screenshotPublicId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected']).optional(),
  userId: z.string().uuid().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'POST') {
      // Public endpoint: create donation
      const validatedData = donationSchema.parse(req.body)

      let userId = validatedData.userId
      let email = validatedData.email

      const user = await getUser(req)
      if (user) {
        userId = user.id
        email = user.email || email
      }

      const { data, error } = await supabase
        .from('donations')
        .insert([{
          user_id: userId || null,
          donor_name: validatedData.donorName,
          email: email,
          amount: validatedData.amount,
          payment_method: validatedData.paymentMethod,
          screenshot_url: validatedData.screenshotUrl || null,
          screenshot_public_id: validatedData.screenshotPublicId || null,
          status: validatedData.status || 'pending'
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data, 201)
    } else if (req.method === 'GET') {
      // Admin endpoint: list all donations
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, data)
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Donations error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
