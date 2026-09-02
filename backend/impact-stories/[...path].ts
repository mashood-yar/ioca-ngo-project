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
        .select()
        .single()

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

