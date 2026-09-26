import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAuth, requireAdmin } from '../_lib/auth'
import { applyRateLimit } from '../_lib/rateLimit'
import { cors } from '../_lib/cors'
import { uploadBase64Image } from '../_lib/upload'
import { Resend } from 'resend'
import {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
  sendApplicationApproved,
  sendApplicationRejected,
} from '../_lib/email'

const createApplicationSchema = z.object({
  fullName: z.string().min(2),
  fatherName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string(),
  cnic: z.string(),
  address: z.string(),
  occupation: z.string(),
  zoneId: z.string().uuid(),
  tierId: z.string().uuid(),
  motivation: z.string().optional(),
  profileImageUrl: z.string().url(),
  profileImagePublicId: z.string().optional().nullable(),
})


const uploadSchema = z.object({
  file: z.string().startsWith('data:image/').optional().nullable(),
  image: z.string().startsWith('data:image/').optional().nullable(),
  folder: z.string().optional().nullable(),
}).refine(
  (obj) => obj.file || obj.image,
  'Either file or image must be provided'
)

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
  profileImageUrl: z.string().optional().nullable().or(z.literal('')),
  profileImagePublicId: z.string().optional(),
  joinedAt: z.preprocess((val) => {
    if (typeof val === 'string' && val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return val;
  }, z.string().datetime().optional().nullable().or(z.literal(''))),
  isActive: z.boolean().optional(),
  userId: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
})
const updateMemberSchema = createMemberSchema.partial()

const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
})

function toDbRow(d: Partial<z.infer<typeof createMemberSchema>>) {
  const userId = d.user_id !== undefined ? d.user_id : d.userId;
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
    ...(userId               !== undefined && { user_id: userId }),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []
  const resource = segments[0]
  const subPath = segments[1]

  try {
    // === Applications Resource ===
    if (resource === 'applications') {
      if (req.method === 'POST') {
        if (!applyRateLimit(req, res)) return

        const validatedData = createApplicationSchema.parse(req.body)
        
        let userId: string | null = null;
        let userEmail: string = validatedData.email || '';

        // Attempt to get user from auth token if provided
        const authHeader = req.headers.authorization
        if (authHeader) {
          const token = authHeader.split(' ')[1]
          if (token) {
             const { data: { user: authUser } } = await supabase.auth.getUser(token)
             if (authUser) {
               userId = authUser.id;
               if (!userEmail) userEmail = authUser.email || '';
             }
          }
        }

        if (!userEmail) {
          return err(res, 'Email is required for public applications', 400);
        }

        // Check if application already exists for this email or user
        let query = supabase.from('applications').select('status').neq('status', 'rejected')
        if (userId) {
          query = query.eq('user_id', userId)
        } else {
          query = query.eq('email', userEmail)
        }

        const { data: existingApp } = await query.maybeSingle()

        if (existingApp) {
          return err(res, 'You already have a pending or active application', 409)
        }

        const { data: newApp, error: insertError } = await supabase
          .from('applications')
          .insert({
            user_id: userId,
            email: userEmail,
            status: 'pending',
            zone_id: validatedData.zoneId,
            tier_id: validatedData.tierId,
            full_name: validatedData.fullName,
            father_name: validatedData.fatherName,
            phone: validatedData.phone,
            cnic: validatedData.cnic,
            address: validatedData.address,
            occupation: validatedData.occupation,
            motivation: validatedData.motivation,
            profile_image_url: validatedData.profileImageUrl,
            profile_image_public_id: validatedData.profileImagePublicId || null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Two-way sync: if logged in, update master profile
        if (userId) {
          await supabase.from('profiles').update({
            full_name: validatedData.fullName,
            father_name: validatedData.fatherName,
            phone: validatedData.phone,
            cnic: validatedData.cnic,
            address: validatedData.address,
            occupation: validatedData.occupation,
            avatar_url: validatedData.profileImageUrl,
            email: userEmail
          }).eq('id', userId);
        }

        const [{ data: zone }, { data: tier }] = await Promise.all([
          supabase.from('zones').select('name').eq('id', validatedData.zoneId).single(),
          supabase.from('tiers').select('name').eq('id', validatedData.tierId).single()
        ])

        const zoneName = zone?.name || 'Selected Zone'
        const tierName = tier?.name || 'Selected Tier'
        const adminEmail = process.env.RESEND_FROM_EMAIL || 'admin@ioca.org'

        try { await sendApplicationConfirmation(userEmail, validatedData.fullName, zoneName, tierName) } catch(e) { console.error(e) }
        try { await sendNewApplicationNotification(adminEmail, validatedData.fullName, zoneName, tierName) } catch(e) { console.error(e) }

        // Auto-sync uploaded profile picture and details to main user profile if logged in
        if (userId) {
          await supabase.from('profiles').update({
            avatar_url: validatedData.profileImageUrl || null,
            phone: validatedData.phone || null,
            cnic: validatedData.cnic || null,
            father_name: validatedData.fatherName || null,
          }).eq('id', userId)
        }

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
        if (!applyRateLimit(req, res)) return

        const { file, image, folder } = uploadSchema.parse(req.body)
        const base64Str = file || image || ''

        const { url, publicId } = await uploadBase64Image(base64Str, folder || undefined)
        return ok(res, { url, publicId }, 201)
      }
    }

    // === Proxy Image Resource ===
    if (resource === 'proxy-image') {
      if (req.method === 'GET') {
        const imageUrl = req.query.url as string;
        if (!imageUrl) return err(res, 'Missing url parameter', 400);
        
        try {
          const fetchRes = await fetch(imageUrl);
          if (!fetchRes.ok) throw new Error('Failed to fetch image');
          
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const sharp = (await import('sharp')).default;
          let pipeline = sharp(buffer);
          
          if (req.query.circle === 'true') {
            pipeline = pipeline.resize(400, 400, { fit: 'cover' });
            const circleSvg = `<svg width="400" height="400"><circle cx="200" cy="200" r="200" fill="white"/></svg>`;
            const pngBuffer = await pipeline.composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }]).png({ force: true }).toBuffer();
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(pngBuffer);
          } else {
            const jpegBuffer = await pipeline.jpeg({ quality: 90, force: true }).toBuffer();
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(jpegBuffer);
          }
        } catch (e: any) {
          console.error('Proxy image error:', e);
          return err(res, e.message || 'Image proxy failed', 500);
        }
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
        const { name, full_name, phone, address, cnic, occupation, avatar_url, onboarding_completed, father_name } = req.body
        // Accept both 'name' (legacy) and 'full_name' (correct column name)
        const resolvedName = full_name || name
        const updatePayload: any = {
          id: user.id,
          full_name: resolvedName,
          phone: phone || null,
          address: address || null,
          cnic: cnic || null,
          occupation: occupation || null,
          avatar_url: avatar_url || null,
          updated_at: new Date().toISOString(),
        }
        if (onboarding_completed !== undefined) updatePayload.onboarding_completed = onboarding_completed
        if (father_name !== undefined) updatePayload.father_name = father_name

        const { data, error } = await supabase
          .from('profiles')
          .upsert(updatePayload)
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
            .select('*, zones(name, city), tiers(name, price)')
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
            let finalUserId = application.user_id;

            // Handle Guest Applications
            if (!finalUserId && application.email) {
              const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'; // e.g. "x9k2m4pzA1!"
              const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: application.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: application.full_name }
              });

              if (!authError && authData.user) {
                finalUserId = authData.user.id;
                
                // Update application with the new user_id
                await supabase.from('applications').update({ user_id: finalUserId }).eq('id', application.id);

                // Create the global profile record
                await supabase.from('profiles').insert({
                  id: finalUserId,
                  full_name: application.full_name,
                  father_name: application.father_name || null,
                  email: application.email,
                  phone: application.phone || null,
                  cnic: application.cnic || null,
                  address: application.address || null,
                  occupation: application.occupation || null,
                  avatar_url: application.profile_image_url || null,
                  role: 'member',
                  is_volunteer: false
                });

                // Send email with temp password
                try {
                  const { Resend } = require('resend');
                  const resend = new Resend(process.env.RESEND_API_KEY);
                  await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'admin@ioca.org',
                    to: application.email,
                    subject: 'Welcome to IOCA! Your Membership is Approved',
                    html: `
                      <h3>Congratulations ${application.full_name}!</h3>
                      <p>Your IOCA membership application has been approved.</p>
                      <p>An account has been automatically generated for you to access the dashboard and download your Digital ID Card.</p>
                      <p><strong>Login Email:</strong> ${application.email}</p>
                      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                      <p>Please log in and change your password immediately.</p>
                    `
                  });
                } catch (emailErr) {
                  console.error("Failed to send guest welcome email", emailErr);
                }
              }
            }

            const durationDays = application.tiers?.duration_days || 365
            const startDate = new Date()
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + durationDays)

            const { error: membershipError } = await supabase.from('memberships').insert({
              user_id: finalUserId,
              tier_id: application.tier_id,
              status: 'active',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              payment_ref: validatedData.paymentRef || `IOCA-${Date.now()}`,
              payment_method: validatedData.paymentMethod || 'Manual',
            })
            if (membershipError) console.error('Failed to create membership:', membershipError.message)

            const { error: memberError } = await supabase.from('members').insert({
              user_id: finalUserId,
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
            await sendApplicationRejected(application.email, application.full_name, validatedData.adminNotes).catch(console.error)
          }

          return ok(res, { ...application, ...updatePayload })
        }
      }

      if (adminSub === 'tiers') {
        if (req.method === 'GET') {
          const user = await requireAdmin(req, res)
          if (!user) return
          const { data, error } = await supabase
            .from('tiers')
            .select('*')
            .order('price', { ascending: true })
          if (error) throw error
          return ok(res, data)
        }

        if (req.method === 'POST') {
          const user = await requireAdmin(req, res)
          if (!user) return
          const schema = z.object({
            name: z.string().min(2),
            nameUr: z.string().optional(),
            price: z.number().min(0),
            durationDays: z.number().min(1),
            benefits: z.array(z.string()).optional(),
            isActive: z.boolean().default(true)
          })
          const validatedData = schema.parse(req.body)
          const { data, error } = await supabase.from('tiers').insert({
            name: validatedData.name,
            name_ur: validatedData.nameUr,
            price: validatedData.price,
            duration_days: validatedData.durationDays,
            benefits: validatedData.benefits,
            is_active: validatedData.isActive
          }).select().single()
          
          if (error) throw error
          return ok(res, data, 201)
        }

        if (req.method === 'PATCH' && adminId) {
          const user = await requireAdmin(req, res)
          if (!user) return
          const schema = z.object({
            name: z.string().min(2).optional(),
            nameUr: z.string().optional(),
            price: z.number().min(0).optional(),
            durationDays: z.number().min(1).optional(),
            benefits: z.array(z.string()).optional(),
            isActive: z.boolean().optional()
          })
          const validatedData = schema.parse(req.body)
          
          const updatePayload: Record<string, any> = {}
          if (validatedData.name !== undefined) updatePayload.name = validatedData.name
          if (validatedData.nameUr !== undefined) updatePayload.name_ur = validatedData.nameUr
          if (validatedData.price !== undefined) updatePayload.price = validatedData.price
          if (validatedData.durationDays !== undefined) updatePayload.duration_days = validatedData.durationDays
          if (validatedData.benefits !== undefined) updatePayload.benefits = validatedData.benefits
          if (validatedData.isActive !== undefined) updatePayload.is_active = validatedData.isActive
          
          const { data, error } = await supabase
            .from('tiers')
            .update(updatePayload)
            .eq('id', adminId)
            .select()
            .single()
            
          if (error) throw error
          return ok(res, data)
        }

        if (req.method === 'DELETE' && adminId) {
          const user = await requireAdmin(req, res)
          if (!user) return
          // Check if memberships exist
          const { count, error: countErr } = await supabase
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('tier_id', adminId)
            
          if (countErr) throw countErr
          if (count && count > 0) {
            return err(res, 'Cannot delete tier because it has active or past memberships attached. Please mark it as Inactive instead.', 400)
          }
          
          // Check if applications exist
          const { count: appCount, error: appCountErr } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('tier_id', adminId)
            
          if (appCountErr) throw appCountErr
          if (appCount && appCount > 0) {
             return err(res, 'Cannot delete tier because there are membership applications attached. Please mark it as Inactive instead.', 400)
          }
          
          const { error } = await supabase.from('tiers').delete().eq('id', adminId)
          if (error) throw error
          return ok(res, { success: true })
        }
      }

      if (adminSub === 'payment-methods') {
        if (req.method === 'GET') {
          const user = await requireAdmin(req, res)
          if (!user) return
          const { data, error } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: false })
          if (error) throw error
          return ok(res, data)
        }
        if (req.method === 'POST') {
          const user = await requireAdmin(req, res)
          if (!user) return
          const schema = z.object({
            type: z.string(), provider_name: z.string(), account_title: z.string(), account_number: z.string(), iban: z.string().optional(), is_active: z.boolean().default(true)
          })
          const val = schema.parse(req.body)
          const { data, error } = await supabase.from('payment_methods').insert(val).select().single()
          if (error) throw error
          return ok(res, data, 201)
        }
        if (req.method === 'PATCH' && adminId) {
          const user = await requireAdmin(req, res)
          if (!user) return
          const schema = z.object({
            type: z.string().optional(), provider_name: z.string().optional(), account_title: z.string().optional(), account_number: z.string().optional(), iban: z.string().optional(), is_active: z.boolean().optional()
          })
          const val = schema.parse(req.body)
          const { data, error } = await supabase.from('payment_methods').update(val).eq('id', adminId).select().single()
          if (error) throw error
          return ok(res, data)
        }
        if (req.method === 'DELETE' && adminId) {
          const user = await requireAdmin(req, res)
          if (!user) return
          const { error } = await supabase.from('payment_methods').delete().eq('id', adminId)
          if (error) throw error
          return ok(res, { success: true })
        }
      }
    }

    if (resource === 'payment-methods' && req.method === 'GET') {
      const { data, error } = await supabase.from('payment_methods').select('*').eq('is_active', true)
      if (error) throw error
      return ok(res, data)
    }


    // === Newsletter Subscription ===
    if (resource === 'newsletter' && req.method === 'POST') {
      const schema = z.object({ email: z.string().email('Valid email is required') })
      const { email } = schema.parse(req.body)
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@iocaworld.org'

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to IOCA Updates! 🌟',
        html: `
          <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:30px;border:1px solid #eaeaea;border-radius:8px;">
            <h2 style="color:#0e7490;margin:0 0 10px;">Thank you for subscribing!</h2>
            <p style="color:#374151;font-size:15px;">You are now subscribed to updates from <strong>IOCA — International Organization For Community Advancement</strong>.</p>
            <p style="color:#374151;font-size:14px;">We will keep you informed about our latest projects, impact stories, and upcoming events. Together, we can make a difference.</p>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0;" />
            <p style="color:#9ca3af;font-size:12px;">You received this because you subscribed at iocaworld.org. To unsubscribe, reply to this email.</p>
          </div>
        `,
      })

      // Also notify admin
      try {
        await resend.emails.send({
          from: fromEmail,
          to: fromEmail,
          subject: `New Newsletter Subscriber: ${email}`,
          html: `<p>New subscriber: <strong>${email}</strong></p>`,
        })
      } catch {}

      return ok(res, { subscribed: true }, 201)
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Misc resource error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}