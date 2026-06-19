import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().optional(),
})

const updateNewsSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
})

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
    // 1. GET /api/news — Public: list all news articles
    if (req.method === 'GET' && !id) {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, news)
    }

    // 2. GET /api/news/:id — Public: get single news article
    if (req.method === 'GET' && id) {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'News article not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, news)
    }

    // 3. POST /api/news — Admin: create news article
    if (req.method === 'POST' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { title, content, imageUrl } = createNewsSchema.parse(req.body)

      const { data: news, error } = await supabase
        .from('news')
        .insert({
          title,
          content,
          image_url: await processImageField(imageUrl),
          published_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, news, 201)
    }

    // 4. PUT /api/news/:id — Admin: update news article
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { title, content, imageUrl } = updateNewsSchema.parse(req.body)

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      }
      if (title !== undefined) updates.title = title
      if (content !== undefined) updates.content = content
      if (imageUrl !== undefined) updates.image_url = await processImageField(imageUrl)

      const { data: news, error } = await supabase
        .from('news')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, news)
    }

    // 5. DELETE /api/news/:id — Admin: delete news article
    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'News article deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    console.error('News error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
