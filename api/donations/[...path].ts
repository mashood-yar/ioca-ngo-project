import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { getUser, requireAuth, requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { sendDonationConfirmationEmail } from '../_lib/email'

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

const updateDonationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected'])
})

const uploadScreenshotSchema = z.object({
  screenshotUrl: z.string().url(),
  screenshotPublicId: z.string()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const segments = (req.query.path as string[]) ?? []
  const first = segments[0]

  try {
    // 1. GET /api/donations/me — Current user's donations (MUST run first before dynamic ID check)
    if (req.method === 'GET' && first === 'me') {
      const user = await requireAuth(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // 2. GET /api/donations — Admin endpoint: list all donations
    if (req.method === 'GET' && !first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // 3. GET /api/donations/:id — Admin endpoint: get single donation
    if (req.method === 'GET' && first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', first)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Donation not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, data)
    }

    // 4. POST /api/donations — Public endpoint: create donation
    if (req.method === 'POST' && !first) {
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
    }

    // 5. PATCH /api/donations/:id — Admin endpoint: update donation status
    if (req.method === 'PATCH' && first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { status } = updateDonationStatusSchema.parse(req.body)

      const updateData: Record<string, unknown> = { status }
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', first)
        .select()
        .single()

      if (error) throw new Error(error.message)

      // Send confirmation email if status is confirmed
      if (status === 'confirmed' && data) {
        sendDonationConfirmationEmail(
          data.donor_name,
          data.email,
          data.amount,
          data.payment_method,
          updateData.confirmed_at as string
        ).catch(console.error)
      }

      return ok(res, data)
    }

    // 6. POST /api/donations/:id/screenshot OR PUT /api/donations/:id — Upload/update screenshot
    if ((req.method === 'POST' && first && segments[1] === 'screenshot') || (req.method === 'PUT' && first)) {
      const { screenshotUrl, screenshotPublicId } = uploadScreenshotSchema.parse(req.body)

      const { data, error } = await supabase
        .from('donations')
        .update({
          screenshot_url: screenshotUrl,
          screenshot_public_id: screenshotPublicId
        })
        .eq('id', first)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // 7. DELETE /api/donations/:id — Admin endpoint: delete donation
    if (req.method === 'DELETE' && first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', first)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Donation deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    console.error('Donations error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}