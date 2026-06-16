import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { sendDonationConfirmationEmail } from '../_lib/email'

const updateDonationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected'])
})

const uploadScreenshotSchema = z.object({
  screenshotUrl: z.string().url(),
  screenshotPublicId: z.string()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { id } = req.query
  if (!id || Array.isArray(id)) {
    return err(res, 'Invalid donation ID', 400)
  }

  try {
    if (req.method === 'GET') {
      // Admin endpoint: get single donation
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Donation not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, data)
    } else if (req.method === 'PATCH') {
      // Admin endpoint: update donation status
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
        .eq('id', id)
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
    } else if (req.method === 'PUT') {
      // Admin endpoint: upload screenshot
      const user = await requireAdmin(req, res)
      if (!user) return

      const { screenshotUrl, screenshotPublicId } = uploadScreenshotSchema.parse(req.body)

      const { data, error } = await supabase
        .from('donations')
        .update({
          screenshot_url: screenshotUrl,
          screenshot_public_id: screenshotPublicId
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    } else if (req.method === 'DELETE') {
      // Admin endpoint: delete donation
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Donation deleted' })
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error(`Donation [${id}] error:`, e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
