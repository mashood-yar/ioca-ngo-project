import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from './_lib/supabase'
import { ok, err } from './_lib/response'
import { requireAdmin } from './_lib/auth'
import { cors } from './_lib/cors'
import { processImageField } from './_lib/upload'

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'POST') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { title, description, status, imageUrl } = createProjectSchema.parse(req.body)

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          status,
          image_url: await processImageField(imageUrl),
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, project, 201)
    } else if (req.method === 'GET') {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, projects)
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Projects error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
