import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { applyRateLimit } from '../_lib/rateLimit'
import { sendVolunteerNotification, sendVolunteerAutoresponder, sendVolunteerAcceptedEmail } from '../_lib/email'
import { createPersonnelRecord } from '../_lib/personnelUtils'

// --- Validation Schemas ---

const volunteerSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  father_name: z.string().min(2, 'Father name is required'),
  profile_image_url: z.string().url('Profile image is required'),
  profile_image_public_id: z.string().optional().nullable(),
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  city: z.string().min(1, 'City is required'),
  cnic: z.string().regex(/^\d{5}-?\d{7}-?\d{1}$/, 'Valid 13-digit CNIC is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  education: z.string().min(1, 'Education level is required'),
  availability: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  skills_detail: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
  heard_from: z.string().optional().nullable(),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(1, 'Emergency contact phone is required'),
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
  // segments[0] = id or 'index', segments[1] = sub-action e.g. 'convert'
  const id = segments[0] === 'index' ? undefined : segments[0]
  const subAction = segments[1]

  try {

    // ── POST /volunteers — Public application submission ──────────────────────
    if (req.method === 'POST' && !id) {
      if (!applyRateLimit(req, res)) return
      try {
        const validated = volunteerSchema.parse(req.body)
        const { error } = await supabase
          .from('volunteers')
          .insert({
            user_id: validated.user_id || null,
            father_name: validated.father_name,
            profile_image_url: validated.profile_image_url,
            profile_image_public_id: validated.profile_image_public_id || null,
            full_name: validated.full_name,
            email: validated.email,
            phone: validated.phone,
            city: validated.city,
            cnic: validated.cnic,
            date_of_birth: validated.date_of_birth,
            education: validated.education,
            availability: validated.availability || null,
            skills: validated.skills || null,
            skills_detail: validated.skills_detail || null,
            motivation: validated.motivation || null,
            heard_from: validated.heard_from || null,
            emergency_contact_name: validated.emergency_contact_name,
            emergency_contact_phone: validated.emergency_contact_phone,
            status: 'pending',
          })
        if (error) throw new Error(error.message)

        try {
          await Promise.all([
            sendVolunteerNotification(validated.full_name, validated.email, validated.city, validated.skills),
            sendVolunteerAutoresponder(validated.full_name, validated.email)
          ])
        } catch (e) {
          console.error('Failed to send volunteer emails:', e)
        }

        return ok(res, { success: true }, 201)
      } catch (e: any) {
        if (e instanceof z.ZodError) {
          return err(res, e.errors[0]?.message || 'Validation error', 400)
        }
        return err(res, e.message || 'Server error', 500)
      }
    }

    // ── GET /volunteers — List (admin) ────────────────────────────────────────
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

    // ── GET /volunteers/:id — Single (admin) ──────────────────────────────────
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

    // ── PATCH /volunteers/:id — Update status (admin) ─────────────────────────
    if (req.method === 'PATCH' && id && !subAction) {
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

    // ── POST /volunteers/:id/convert — Convert accepted volunteer to personnel ──
    if (req.method === 'POST' && id && subAction === 'convert') {
      const user = await requireAdmin(req, res)
      if (!user) return

      // 1. Fetch the volunteer record
      const { data: volunteer, error: fetchErr } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchErr || !volunteer) return err(res, 'Volunteer not found', 404)
      if (volunteer.status !== 'accepted') {
        return err(res, 'Only accepted volunteers can be converted to personnel', 400)
      }

      // 2. Prevent duplicate conversion: check if a personnel record already exists
      //    matching by email under the 'volunteer' category.
      if (volunteer.email) {
        const { data: existing } = await supabase
          .from('personnel')
          .select('id, uid')
          .eq('category', 'volunteer')
          .eq('email', volunteer.email)
          .maybeSingle()

        if (existing) {
          return err(res, `This volunteer has already been converted to personnel (${existing.uid})`, 409)
        }
      }

      // 3. Create the personnel record (generates UID + QR code)
      const personnelRecord = await createPersonnelRecord({
        category: 'volunteer',
        full_name: volunteer.full_name,
        email: volunteer.email || null,
        phone: volunteer.phone || null,
        title: 'Volunteer',
        bio: volunteer.motivation || null,
        status: 'active',
      })

      // 4. Send acceptance email with the assigned UID
      if (volunteer.email) {
        try {
          await sendVolunteerAcceptedEmail(volunteer.full_name, volunteer.email, personnelRecord.uid)
        } catch (e) {
          console.error('Failed to send volunteer accepted email:', e)
        }
      }

      return ok(res, { personnel: personnelRecord }, 201)
    }

    // ── DELETE /volunteers/:id — Delete application (admin) ───────────────────
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
