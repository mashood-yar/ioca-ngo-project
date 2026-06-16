import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from './_lib/supabase'
import { ok, err } from './_lib/response'
import { requireAdmin } from './_lib/auth'
import { cors } from './_lib/cors'
import { processImageField } from './_lib/upload'

const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'POST') {
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
    } else if (req.method === 'GET') {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, news)
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('News error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
