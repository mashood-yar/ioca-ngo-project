import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from './_lib/supabase'
import { ok, err } from './_lib/response'
import { requireAdmin } from './_lib/auth'
import { cors } from './_lib/cors'
import { processImageField } from './_lib/upload'

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'POST') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { title, description, location, eventDate, imageUrl } = createEventSchema.parse(req.body)

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          title,
          description,
          location,
          event_date: eventDate,
          image_url: await processImageField(imageUrl),
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, event, 201)
    } else if (req.method === 'GET') {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, events)
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Events error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
