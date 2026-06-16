import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const updateNewsSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { id } = req.query
  if (!id || Array.isArray(id)) {
    return err(res, 'Invalid news ID', 400)
  }

  try {
    if (req.method === 'GET') {
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
    } else if (req.method === 'PUT') {
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
    } else if (req.method === 'DELETE') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'News article deleted' })
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error(`News [${id}] error:`, e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
