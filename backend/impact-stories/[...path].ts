import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const createImpactStorySchema = z.object({
  titleEn: z.string().min(1, 'English Title is required'),
  titleUr: z.string().optional().nullable().or(z.literal('')),
  excerptEn: z.string().optional().nullable().or(z.literal('')),
  excerptUr: z.string().optional().nullable().or(z.literal('')),
  contentEn: z.string().optional().nullable().or(z.literal('')),
  contentUr: z.string().optional().nullable().or(z.literal('')),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  category: z.string().nullable().optional().or(z.literal('')),
})

const updateImpactStorySchema = createImpactStorySchema.partial()

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
    // 1. GET /api/impact-stories
    if (req.method === 'GET' && !id) {
      const { limit } = req.query
      
      let query = supabase
        .from('impact_stories')
        .select('*')
        .order('published_at', { ascending: false })
      
      if (limit) {
        query = query.limit(parseInt(limit as string, 10))
      }

      const { data: stories, error } = await query

      if (error) throw new Error(error.message)
      return ok(res, stories)
    }

    // 2. GET /api/impact-stories/:id
    if (req.method === 'GET' && id) {
      const { data: story, error } = await supabase
        .from('impact_stories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Story not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, story)
    }

    // ── PUBLIC: POST /api/impact-stories/submit ─────────────────────────────
    if (req.method === 'POST' && segments[0] === 'submit') {
      const submitSchema = z.object({
        submitter_name:     z.string().min(2, 'Full name required').max(100),
        submitter_email:    z.string().email('Valid email required'),
        submitter_phone:    z.string().optional().nullable(),
        submitter_location: z.string().optional().nullable(),
        title_en:           z.string().min(5, 'Title required').max(200),
        title_ur:           z.string().optional().nullable(),
        story_en:           z.string().min(100, 'Story must be at least 100 characters').max(5000),
        story_ur:           z.string().optional().nullable(),
        category:           z.string().default('General'),
        image_url:          z.string().optional().nullable(),
        image_public_id:    z.string().optional().nullable(),
        program_name:       z.string().optional().nullable(),
        year_of_impact:     z.number().int().min(2000).max(new Date().getFullYear()).optional().nullable(),
        consent_to_publish: z.literal(true, { errorMap: () => ({ message: 'You must consent to publish' }) }),
        consent_to_edit:    z.boolean().default(false),
        user_id:            z.string().uuid().optional().nullable(),
        honeypot:           z.string().optional(),
      })

      // Honeypot spam protection
      const reqBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (reqBody.honeypot) {
        return ok(res, { submitted: true }) // Silently succeed for bots
      }

      // Rate limit: max 3 per email per hour
      const emailCheck = reqBody.submitter_email?.replace(/[^a-zA-Z0-9@._+-]/g, '') || ''
      if (emailCheck) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
          const { count, error: countErr } = await supabase
          .from('impact_story_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('submitter_email', emailCheck)
          .gte('submitted_at', oneHourAgo)
          if (!countErr && (count ?? 0) >= 3) {
          return err(res, 'Too many submissions. Please try again later.', 429)
        }
      }

      const body = submitSchema.parse(reqBody)

      const { data: submission, error: insertError } = await supabase
        .from('impact_story_submissions')
        .insert({
          submitter_name:     body.submitter_name,
          submitter_email:    body.submitter_email,
          submitter_phone:    body.submitter_phone ?? null,
          submitter_location: body.submitter_location ?? null,
          user_id:            body.user_id ?? null,
          title_en:           body.title_en,
          title_ur:           body.title_ur ?? null,
          story_en:           body.story_en,
          story_ur:           body.story_ur ?? null,
          category:           body.category || 'General',
          image_url:          body.image_url ?? null,
          image_public_id:    body.image_public_id ?? null,
          program_name:       body.program_name ?? null,
          year_of_impact:     body.year_of_impact ?? null,
          consent_to_publish: true,
          consent_to_edit:    body.consent_to_edit ?? false,
          status:             'pending',
        })

      if (insertError) throw new Error(insertError.message)
      return ok(res, { submitted: true }, 201)
    }

    // ── ADMIN: GET /api/impact-stories/submissions ───────────────────────────
    if (req.method === 'GET' && segments[0] === 'submissions' && !segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const { status: statusFilter, search } = req.query

      let query = supabase
        .from('impact_story_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as string)
      }
      if (search) {
        query = query.or(`submitter_name.ilike.%${search}%,submitter_email.ilike.%${search}%,title_en.ilike.%${search}%`)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw new Error(fetchError.message)
      return ok(res, data)
    }

    // ── ADMIN: GET /api/impact-stories/submissions/:id ───────────────────────
    if (req.method === 'GET' && segments[0] === 'submissions' && segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const { data, error: fetchError } = await supabase
        .from('impact_story_submissions')
        .select('*')
        .eq('id', segments[1])
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return err(res, 'Submission not found', 404)
        throw new Error(fetchError.message)
      }
      return ok(res, data)
    }

    // ── ADMIN: PATCH /api/impact-stories/submissions/:id ────────────────────
    if (req.method === 'PATCH' && segments[0] === 'submissions' && segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const submissionId = segments[1]
      const { action, rejection_reason, admin_notes, title_en, title_ur, excerpt_en, excerpt_ur, story_en, story_ur, category, image_url } = req.body

      // Get the auth user to record reviewer
      let reviewerId: string | null = null
      try {
        const token = (req.headers.authorization || '').replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        reviewerId = user?.id ?? null
      } catch {}

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

      // Content edits
      if (title_en !== undefined)    updates.title_en   = title_en
      if (title_ur !== undefined)    updates.title_ur   = title_ur
      if (excerpt_en !== undefined)  updates.excerpt_en = excerpt_en
      if (excerpt_ur !== undefined)  updates.excerpt_ur = excerpt_ur
      if (story_en !== undefined)    updates.story_en   = story_en
      if (story_ur !== undefined)    updates.story_ur   = story_ur
      if (category !== undefined)    updates.category   = category
      if (image_url !== undefined)   updates.image_url  = image_url
      if (admin_notes !== undefined) updates.admin_notes = admin_notes

      if (action === 'approve') {
        // Fetch current submission state
        const { data: sub, error: subErr } = await supabase
          .from('impact_story_submissions')
          .select('*')
          .eq('id', submissionId)
          .single()
        if (subErr) throw new Error(subErr.message)

        // Merge edits with existing values
        const finalTitle   = (title_en   ?? sub.title_en)   as string
        const finalTitleUr = (title_ur   ?? sub.title_ur)   as string | null
        const finalExcerpt = (excerpt_en ?? sub.excerpt_en) as string | null
        const finalExcerptUr = (excerpt_ur ?? sub.excerpt_ur) as string | null
        const finalStory   = (story_en   ?? sub.story_en)   as string
        const finalStoryUr = (story_ur   ?? sub.story_ur)   as string | null
        const finalCategory = (category  ?? sub.category)   as string
        const finalImageUrl = (image_url ?? sub.image_url)  as string | null

        // Create live impact_stories record
        const { data: liveStory, error: liveErr } = await supabase
          .from('impact_stories')
          .insert({
            title_en:    finalTitle,
            title_ur:    finalTitleUr,
            excerpt_en:  finalExcerpt,
            excerpt_ur:  finalExcerptUr,
            content_en:  finalStory,
            content_ur:  finalStoryUr,
            category:    finalCategory,
            image_url:   finalImageUrl,
            published_at: new Date().toISOString(),
          })

        if (liveErr) throw new Error(liveErr.message)

        updates.status             = 'approved'
        updates.published_story_id = liveStory.id
        updates.reviewed_by        = reviewerId
        updates.reviewed_at        = new Date().toISOString()

      } else if (action === 'reject') {
        updates.status           = 'rejected'
        updates.rejection_reason = rejection_reason ?? null
        updates.reviewed_by      = reviewerId
        updates.reviewed_at      = new Date().toISOString()
      }

      const { data: updated, error: updateErr } = await supabase
        .from('impact_story_submissions')
        .update(updates)
        .eq('id', submissionId)

      if (updateErr) throw new Error(updateErr.message)
      return ok(res, updated)
    }

    // ── ADMIN: DELETE /api/impact-stories/submissions/:id ───────────────────
    if (req.method === 'DELETE' && segments[0] === 'submissions' && segments[1]) {
      if (!(await requireAdmin(req, res))) return

      const { error: delErr } = await supabase
        .from('impact_story_submissions')
        .delete()
        .eq('id', segments[1])

      if (delErr) throw new Error(delErr.message)
      return ok(res, { deleted: true })
    }

    // 3. POST /api/impact-stories
    if (req.method === 'POST' && !id) {
      if (!(await requireAdmin(req, res))) return

      const body = createImpactStorySchema.parse(req.body)
      const imageUrl = body.image_url ?? body.imageUrl
      
      const { data: story, error } = await supabase
        .from('impact_stories')
        .insert({
          title_en: body.titleEn,
          title_ur: body.titleUr,
          excerpt_en: body.excerptEn,
          excerpt_ur: body.excerptUr,
          content_en: body.contentEn,
          content_ur: body.contentUr,
          category: body.category || 'General',
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
        })

        .select()
        .single()
      if (error) throw new Error(error.message)
      return ok(res, story, 201)
    }

    // 4. PATCH /api/impact-stories/:id
    if (req.method === 'PATCH' && id) {
      if (!(await requireAdmin(req, res))) return

      const body = updateImpactStorySchema.parse(req.body)
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      
      if (body.titleEn !== undefined) updates.title_en = body.titleEn
      if (body.titleUr !== undefined) updates.title_ur = body.titleUr
      if (body.excerptEn !== undefined) updates.excerpt_en = body.excerptEn
      if (body.excerptUr !== undefined) updates.excerpt_ur = body.excerptUr
      if (body.contentEn !== undefined) updates.content_en = body.contentEn
      if (body.contentUr !== undefined) updates.content_ur = body.contentUr
      if (body.category !== undefined) updates.category = body.category
      
      const imageUrl = body.image_url !== undefined ? body.image_url : body.imageUrl
      if (imageUrl !== undefined) {
        updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null
      }

      const { data: story, error } = await supabase
        .from('impact_stories')
        .update(updates)
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, story)
    }

    // 5. DELETE /api/impact-stories/:id
    if (req.method === 'DELETE' && id) {
      if (!(await requireAdmin(req, res))) return

      const { error } = await supabase
        .from('impact_stories')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { deleted: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: e.errors })
    }
    console.error('[impact-stories API Error]', e)
    return err(res, e.message || 'Internal server error', 500)
  }
}







