import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAuth, requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { uploadBase64Image } from '../_lib/upload'
import { sendApplicationConfirmation, sendNewApplicationNotification } from '../_lib/email'

const createApplicationSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string(),
  cnic: z.string(),
  address: z.string(),
  occupation: z.string(),
  zoneId: z.string().uuid(),
  tierId: z.string().uuid(),
  motivation: z.string().optional(),
})

const uploadSchema = z.object({
  image: z.string().startsWith('data:image/'),
  folder: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const segments = (req.query.path as string[]) ?? []
  const resource = segments[0]
  const subPath = segments[1]

  try {
    // === Applications Resource ===
    if (resource === 'applications') {
      if (req.method === 'POST') {
        const user = await requireAuth(req, res)
        if (!user) return

        const validatedData = createApplicationSchema.parse(req.body)

        const { data: existingApp } = await supabase
          .from('applications')
          .select('status')
          .eq('user_id', user.id)
          .neq('status', 'rejected')
          .maybeSingle()

        if (existingApp) {
          return err(res, 'You already have a pending or active application', 409)
        }

        const { data: newApp, error: insertError } = await supabase
          .from('applications')
          .insert({
            user_id: user.id,
            email: user.email!,
            status: 'pending',
            zone_id: validatedData.zoneId,
            tier_id: validatedData.tierId,
            full_name: validatedData.fullName,
            phone: validatedData.phone,
            cnic: validatedData.cnic,
            address: validatedData.address,
            occupation: validatedData.occupation,
            motivation: validatedData.motivation,
          })
          .select()
          .single()

        if (insertError) throw insertError

        const [{ data: zone }, { data: tier }] = await Promise.all([
          supabase.from('zones').select('name').eq('id', validatedData.zoneId).single(),
          supabase.from('tiers').select('name').eq('id', validatedData.tierId).single()
        ])

        const zoneName = zone?.name || 'Selected Zone'
        const tierName = tier?.name || 'Selected Tier'
        const adminEmail = process.env.RESEND_FROM_EMAIL || 'admin@ioca.org'

        sendApplicationConfirmation(user.email!, validatedData.fullName, zoneName, tierName).catch(console.error)
        sendNewApplicationNotification(adminEmail, validatedData.fullName, zoneName, tierName).catch(console.error)

        return ok(res, newApp, 201)
      }

      if (req.method === 'GET' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return

        const { data, error } = await supabase
          .from('applications')
          .select('*, zones(name, city), tiers(name, price)')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          return err(res, 'No application found', 404)
        }

        return ok(res, data)
      }

      if (req.method === 'DELETE' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return

        // Check status first
        const { data, error } = await supabase
          .from('applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        if (!data) return err(res, 'No application found', 404)
        if (data.status !== 'rejected') {
          return err(res, 'Can only delete rejected applications', 403)
        }

        // Delete
        const { error: deleteError } = await supabase
          .from('applications')
          .delete()
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        return ok(res, null)
      }
    }

    // === Upload Resource ===
    if (resource === 'upload') {
      if (req.method === 'POST') {
        const user = await requireAdmin(req, res)
        if (!user) return

        const { image, folder } = uploadSchema.parse(req.body)

        const { url, publicId } = await uploadBase64Image(image, folder)
        return ok(res, { url, publicId }, 201)
      }
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    console.error('Misc resource error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}