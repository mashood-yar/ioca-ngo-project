import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAuth, requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { uploadBase64Image } from '../_lib/upload'
import {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
  sendApplicationApproved,
  sendApplicationRejected,
} from '../_lib/email'

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

const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  description: z.string().optional(),
})
const updateZoneSchema = createZoneSchema.partial()

const createMemberSchema = z.object({
  zoneId: z.string().uuid('Invalid zone ID'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  roleInOrg: z.string().optional(),
  profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  profileImagePublicId: z.string().optional(),
  joinedAt: z.string().datetime().optional(),
  isActive: z.boolean().optional()
})
const updateMemberSchema = createMemberSchema.partial()

const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
})

function toDbRow(d: Partial<z.infer<typeof createMemberSchema>>) {
  return {
    ...(d.zoneId             !== undefined && { zone_id: d.zoneId }),
    ...(d.fullName           !== undefined && { full_name: d.fullName }),
    ...(d.email              !== undefined && { email: d.email }),
    ...(d.phone              !== undefined && { phone: d.phone }),
    ...(d.cnic               !== undefined && { cnic: d.cnic }),
    ...(d.roleInOrg          !== undefined && { role_in_org: d.roleInOrg }),
    ...(d.profileImageUrl    !== undefined && { profile_image_url: d.profileImageUrl }),
    ...(d.profileImagePublicId !== undefined && { profile_image_public_id: d.profileImagePublicId }),
    ...(d.joinedAt           !== undefined && { joined_at: d.joinedAt }),
    ...(d.isActive           !== undefined && { is_active: d.isActive }),
  }
}

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

    // === Zones Resource ===
    if (resource === 'zones') {
      if (req.method === 'GET' && !subPath) {
        const { data, error } = await supabase
          .from('zones')
          .select('*, members:members(count)')
        if (error) throw error
        return ok(res, data)
      }

      if (req.method === 'GET' && subPath) {
        const { data, error } = await supabase
          .from('zones')
          .select('*')
          .eq('id', subPath)
          .single()
        if (error) {
          if (error.code === 'PGRST116') return err(res, 'Zone not found', 404)
          throw error
        }
        return ok(res, data)
      }

      if (req.method === 'POST' && !subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const validatedData = createZoneSchema.parse(req.body)
        const { data, error } = await supabase
          .from('zones')
          .insert(validatedData)
          .select()
          .single()
        if (error) throw error
        return ok(res, data, 201)
      }

      if (req.method === 'PUT' && subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const validatedData = updateZoneSchema.parse(req.body)
        const { data, error } = await supabase
          .from('zones')
          .update(validatedData)
          .eq('id', subPath)
          .select()
          .single()
        if (error) throw error
        return ok(res, data)
      }

      if (req.method === 'DELETE' && subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const { error } = await supabase
          .from('zones')
          .delete()
          .eq('id', subPath)
        if (error) throw error
        return ok(res, null)
      }
    }

    // === Tiers Resource ===
    if (resource === 'tiers') {
      if (req.method === 'GET' && !subPath) {
        const { data, error } = await supabase
          .from('tiers')
          .select('*')
          .eq('is_active', true)
          .order('price')
        if (error) throw error
        return ok(res, data)
      }
    }

    // === Members Resource ===
    if (resource === 'members') {
      if (req.method === 'GET' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return
        const { data, error } = await supabase
          .from('members')
          .select('*, zone:zones(*)')
          .eq('email', user.email!)
          .limit(1)
          .single()
        if (error && error.code === 'PGRST116') {
          return ok(res, null)
        }
        if (error) throw error
        return ok(res, data)
      }

      if (req.method === 'GET' && !subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const { zone } = req.query
        let query = supabase.from('members').select('*, zone:zones(name)')
        if (zone && typeof zone === 'string') {
          query = query.eq('zone_id', zone)
        }
        const { data, error } = await query
        if (error) throw error
        return ok(res, data)
      }

      if (req.method === 'GET' && subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const { data, error } = await supabase
          .from('members')
          .select('*, zone:zones(name)')
          .eq('id', subPath)
          .single()
        if (error) {
          if (error.code === 'PGRST116') return err(res, 'Member not found', 404)
          throw error
        }
        return ok(res, data)
      }

      if (req.method === 'POST' && !subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const validatedData = createMemberSchema.parse(req.body)
        const { data, error } = await supabase
          .from('members')
          .insert({
            ...toDbRow(validatedData),
            role_in_org: validatedData.roleInOrg ?? 'member'
          })
          .select()
          .single()
        if (error) throw error
        return ok(res, data, 201)
      }

      if (req.method === 'PUT' && subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const validatedData = updateMemberSchema.parse(req.body)
        const dbRow = toDbRow(validatedData)
        if (Object.keys(dbRow).length === 0) {
          return err(res, 'No valid fields provided', 400)
        }
        const { data, error } = await supabase
          .from('members')
          .update(dbRow)
          .eq('id', subPath)
          .select()
          .single()
        if (error) throw error
        return ok(res, data)
      }

      if (req.method === 'DELETE' && subPath) {
        const user = await requireAdmin(req, res)
        if (!user) return
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', subPath)
        if (error) throw error
        return ok(res, null)
      }
    }

    // === Profile Resource ===
    if (resource === 'profile') {
      if (req.method === 'GET' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (error) throw error
        return ok(res, data)
      }

      if (req.method === 'PATCH' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return
        const { name, phone } = req.body
        const { data, error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, name, phone })
          .select()
          .single()
        if (error) throw error
        return ok(res, data)
      }
    }

    // === Memberships Resource ===
    if (resource === 'memberships') {
      if (req.method === 'GET' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return
        const { data, error } = await supabase
          .from('memberships')
          .select('*, tier:tiers(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (error && error.code === 'PGRST116') {
          return ok(res, null)
        }
        if (error) throw error
        return ok(res, data)
      }
    }

    // === Event Registrations Resource ===
    if (resource === 'event-registrations') {
      if (req.method === 'GET' && subPath === 'me') {
        const user = await requireAuth(req, res)
        if (!user) return
        const { data, error } = await supabase
          .from('event_registrations')
          .select('*, event:events(*)')
          .eq('user_id', user.id)
          .order('registered_at', { ascending: false })
        if (error) throw error
        return ok(res, data || [])
      }
    }

    // === Admin Resource (e.g. applications) ===
    if (resource === 'admin') {
      const adminSub = segments[1]
      const adminId = segments[2]
      const adminAction = segments[3]

      if (adminSub === 'applications') {
        if (req.method === 'GET' && !adminId) {
          const user = await requireAdmin(req, res)
          if (!user) return
          const { status } = req.query
          let query = supabase
            .from('applications')
            .select('*, zones(name, city), tiers(name, price), profiles(name, email)')
            .order('submitted_at', { ascending: false })
          if (status && typeof status === 'string') {
            query = query.eq('status', status)
          }
          const { data, error } = await query
          if (error) throw error
          return ok(res, data)
        }

        if (req.method === 'PATCH' && adminId && adminAction === 'status') {
          const user = await requireAdmin(req, res)
          if (!user) return
          const validatedData = updateApplicationStatusSchema.parse(req.body)

          const { data: application, error: fetchError } = await supabase
            .from('applications')
            .select('*, tiers(duration_days, name)')
            .eq('id', adminId)
            .single()

          if (fetchError || !application) {
            return err(res, 'Application not found', 404)
          }

          if (application.status === 'approved') {
            return err(res, 'Application is already approved', 400)
          }

          const updatePayload: Record<string, unknown> = {
            status: validatedData.status,
            updated_at: new Date().toISOString()
          }

          if (validatedData.status === 'approved' || validatedData.status === 'rejected') {
            updatePayload.reviewed_at = new Date().toISOString()
            if (validatedData.adminNotes !== undefined) {
              updatePayload.admin_notes = validatedData.adminNotes
            }
          }

          const { error: updateError } = await supabase
            .from('applications')
            .update(updatePayload)
            .eq('id', adminId)

          if (updateError) throw updateError

          if (validatedData.status === 'approved') {
            const durationDays = application.tiers?.duration_days || 365
            const startDate = new Date()
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + durationDays)

            const { error: membershipError } = await supabase.from('memberships').insert({
              user_id: application.user_id,
              tier_id: application.tier_id,
              status: 'active',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              payment_ref: `IOCA-${Date.now()}`,
            })
            if (membershipError) console.error('Failed to create membership:', membershipError.message)

            const { error: memberError } = await supabase.from('members').insert({
              user_id: application.user_id,
              zone_id: application.zone_id,
              full_name: application.full_name,
              email: application.email,
              phone: application.phone,
              cnic: application.cnic,
              role_in_org: 'member',
              is_active: true,
            })
            if (memberError) console.error('Failed to create member:', memberError.message)

            sendApplicationApproved(
              application.email,
              application.full_name,
              application.tiers?.name || 'Membership',
              endDate.toISOString()
            ).catch(console.error)
          }

          if (validatedData.status === 'rejected') {
            sendApplicationRejected(
              application.email,
              application.full_name,
              validatedData.adminNotes
            ).catch(console.error)
          }

          return ok(res, { ...application, ...updatePayload })
        }
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