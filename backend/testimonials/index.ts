import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []
  const id = segments[0] === 'index' ? undefined : segments[0]

  try {
    // ── GET /api/testimonials ───────────────────────────────────────────────
    // Public: returns all active testimonials ordered by sort_order
    if (req.method === 'GET' && !id) {
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            isAdmin = profile?.role === 'admin';
          }
        } catch {}
      }

      let query = supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
      if (!isAdmin) query = query.eq('is_active', true);
      const { data, error } = await query;

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // ── PUBLIC: POST /api/testimonials/submit ──────────────────────────────
    if (req.method === 'POST' && segments[0] === 'submit') {
      const submitSchema = z.object({
        submitter_name:       z.string().min(2).max(100),
        submitter_email:      z.string().email(),
        submitter_phone:      z.string().optional().nullable(),
        submitter_location:   z.string().min(2, 'Location is required').max(200),
        quote_en:             z.string().min(30, 'Testimonial must be at least 30 characters').max(1000),
        quote_ur:             z.string().optional().nullable(),
        photo_url:            z.string().optional().nullable(),
        photo_public_id:      z.string().optional().nullable(),
        consent_to_publish:   z.literal(true, { errorMap: () => ({ message: 'Consent required' }) }),
        consent_to_use_photo: z.boolean().default(false),
        user_id:              z.string().uuid().optional().nullable(),
        honeypot:             z.string().optional(),
      })

      const reqBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (reqBody.honeypot) {
        return ok(res, { submitted: true })
      }

      const emailCheck = reqBody.submitter_email?.replace(/[^a-zA-Z0-9@._+-]/g, '') || ''
      if (emailCheck) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { count, error: countErr } = await supabase
            .from('testimonial_submissions')
            .select('id', { count: 'exact', head: true })
            .eq('submitter_email', emailCheck)
            .gte('submitted_at', oneHourAgo)
          if (!countErr && (count ?? 0) >= 3) {
          return err(res, 'Too many submissions. Please try again later.', 429)
        }
      }

      const body = submitSchema.parse(reqBody)

      const { data: submission, error: insertError } = await supabase
        .from('testimonial_submissions')
        .insert({
          submitter_name:       body.submitter_name,
          submitter_email:      body.submitter_email,
          submitter_phone:      body.submitter_phone ?? null,
          submitter_location:   body.submitter_location,
          user_id:              body.user_id ?? null,
          quote_en:             body.quote_en,
          quote_ur:             body.quote_ur ?? null,
          photo_url:            body.photo_url ?? null,
          photo_public_id:      body.photo_public_id ?? null,
          consent_to_publish:   true,
          consent_to_use_photo: body.consent_to_use_photo ?? false,
          status:               'pending',
        })

        if (insertError) throw new Error(insertError.message)
        return ok(res, { submitted: true }, 201)
    }

    // ── ADMIN: GET /api/testimonials/submissions ────────────────────────────
    if (req.method === 'GET' && segments[0] === 'submissions' && !segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const { status: statusFilter, search } = req.query
      let query = supabase
        .from('testimonial_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as string)
      }
      if (search) {
        query = query.or(`submitter_name.ilike.%${search}%,submitter_email.ilike.%${search}%,quote_en.ilike.%${search}%`)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw new Error(fetchError.message)
      return ok(res, data)
    }

    // ── ADMIN: GET /api/testimonials/submissions/:id ────────────────────────
    if (req.method === 'GET' && segments[0] === 'submissions' && segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const { data, error: fetchError } = await supabase
        .from('testimonial_submissions')
        .select('*')
        .eq('id', segments[1])
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return err(res, 'Submission not found', 404)
        throw new Error(fetchError.message)
      }
      return ok(res, data)
    }

    // ── ADMIN: PATCH /api/testimonials/submissions/:id ──────────────────────
    if (req.method === 'PATCH' && segments[0] === 'submissions' && segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const submissionId = segments[1]
      const { action, rejection_reason, admin_notes, quote_en, quote_ur, display_name, display_initial, bg_color, sort_order, photo_url } = req.body

      let reviewerId: string | null = null
      try {
        const token = (req.headers.authorization || '').replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        reviewerId = user?.id ?? null
      } catch {}

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

      if (quote_en !== undefined)       updates.quote_en        = quote_en
      if (quote_ur !== undefined)       updates.quote_ur        = quote_ur
      if (display_name !== undefined)   updates.display_name    = display_name
      if (display_initial !== undefined) updates.display_initial = display_initial
      if (bg_color !== undefined)       updates.bg_color        = bg_color
      if (sort_order !== undefined)     updates.sort_order      = sort_order
      if (admin_notes !== undefined)    updates.admin_notes     = admin_notes
      if (photo_url !== undefined)      updates.photo_url       = photo_url

      if (action === 'approve') {
        const { data: sub, error: subErr } = await supabase
          .from('testimonial_submissions')
          .select('*')
          .eq('id', submissionId)
          .single()
        if (subErr) throw new Error(subErr.message)

        const finalName     = (display_name    ?? sub.submitter_name)   as string
        const finalInitial  = ((display_initial ?? sub.display_initial ?? finalName[0]) as string).toUpperCase()
        const finalQuoteEn  = (quote_en        ?? sub.quote_en)         as string
        const finalQuoteUr  = (quote_ur        ?? sub.quote_ur)         as string | null
        const finalLocation = sub.submitter_location                     as string
        const finalBgColor  = (bg_color        ?? sub.bg_color ?? 'white') as string
        const finalSortOrder = (sort_order     ?? sub.sort_order ?? 0)  as number

        const { data: liveTestimonial, error: liveErr } = await supabase
          .from('testimonials')
          .insert({
            quote_en:    finalQuoteEn,
            quote_ur:    finalQuoteUr,
            name_en:     finalName,
            name_ur:     null,
            location_en: finalLocation,
            location_ur: null,
            initial:     finalInitial,
            bg_color:    finalBgColor,
            sort_order:  finalSortOrder,
            is_active:   true,
          })
          .select()
          .single()

        if (liveErr) throw new Error(liveErr.message)

        updates.status                    = 'approved'
        updates.published_testimonial_id  = liveTestimonial.id
        updates.reviewed_by               = reviewerId
        updates.reviewed_at               = new Date().toISOString()

      } else if (action === 'reject') {
        updates.status           = 'rejected'
        updates.rejection_reason = rejection_reason ?? null
        updates.reviewed_by      = reviewerId
        updates.reviewed_at      = new Date().toISOString()
      }

      const { data: updated, error: updateErr } = await supabase
        .from('testimonial_submissions')
        .update(updates)
        .eq('id', submissionId)
        .select()
        .single()

      if (updateErr) throw new Error(updateErr.message)
      return ok(res, updated)
    }

    // ── ADMIN: DELETE /api/testimonials/submissions/:id ─────────────────────
    if (req.method === 'DELETE' && segments[0] === 'submissions' && segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const { error: delErr } = await supabase
        .from('testimonial_submissions')
        .delete()
        .eq('id', segments[1])

      if (delErr) throw new Error(delErr.message)
      return ok(res, { deleted: true })
    }

    // ── POST /api/testimonials ──────────────────────────────────────────────
    // Admin only: create a new testimonial
    if (req.method === 'POST' && !id) {
      if (!(await requireAdmin(req, res))) return

      const { quote_en, quote_ur, name_en, name_ur, location_en, location_ur, initial, bg_color, sort_order } = req.body

      if (!quote_en || !quote_ur || !name_en || !name_ur || !location_en || !location_ur || !initial) {
        return err(res, 'All text fields are required', 400)
      }
      if (initial.length !== 1) {
        return err(res, 'initial must be exactly 1 character', 400)
      }

      const { data, error } = await supabase
        .from('testimonials')
        .insert([{
          quote_en, quote_ur, name_en, name_ur,
          location_en, location_ur,
          initial: initial.toUpperCase(),
          bg_color: bg_color ?? 'white',
          sort_order: sort_order ?? 0,
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data, 201)
    }

    // ── PATCH /api/testimonials/:id ─────────────────────────────────────────
    // Admin only: update a testimonial
    if (req.method === 'PATCH' && id) {
      if (!(await requireAdmin(req, res))) return

      const { quote_en, quote_ur, name_en, name_ur, location_en, location_ur, initial, bg_color, sort_order, is_active } = req.body

      const updates: Record<string, unknown> = {}
      if (quote_en !== undefined) updates.quote_en = quote_en
      if (quote_ur !== undefined) updates.quote_ur = quote_ur
      if (name_en !== undefined) updates.name_en = name_en
      if (name_ur !== undefined) updates.name_ur = name_ur
      if (location_en !== undefined) updates.location_en = location_en
      if (location_ur !== undefined) updates.location_ur = location_ur
      if (initial !== undefined) updates.initial = String(initial).toUpperCase()[0]
      if (bg_color !== undefined) updates.bg_color = bg_color
      if (sort_order !== undefined) updates.sort_order = sort_order
      if (is_active !== undefined) updates.is_active = is_active

      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // ── DELETE /api/testimonials/:id ────────────────────────────────────────
    // Admin only: delete a testimonial
    if (req.method === 'DELETE' && id) {
      if (!(await requireAdmin(req, res))) return

      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { deleted: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[testimonials]', message)
    return err(res, message)
  }
}



