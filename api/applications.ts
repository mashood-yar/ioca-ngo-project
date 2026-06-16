import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from './_lib/supabase'
import { ok, err } from './_lib/response'
import { requireAuth } from './_lib/auth'
import { cors } from './_lib/cors'
import { sendApplicationConfirmation, sendNewApplicationNotification } from './_lib/email'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
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
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Applications error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
