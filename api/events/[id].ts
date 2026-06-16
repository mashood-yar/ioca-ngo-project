import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { id } = req.query
  if (!id || Array.isArray(id)) {
    return err(res, 'Invalid event ID', 400)
  }

  try {
    if (req.method === 'GET') {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Event not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, event)
    } else if (req.method === 'PUT') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { title, description, location, eventDate, imageUrl } = updateEventSchema.parse(req.body)

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (title !== undefined) updates.title = title
      if (description !== undefined) updates.description = description
      if (location !== undefined) updates.location = location
      if (eventDate !== undefined) updates.event_date = eventDate
      if (imageUrl !== undefined) updates.image_url = await processImageField(imageUrl)

      const { data: event, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, event)
    } else if (req.method === 'DELETE') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Event deleted' })
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error(`Event [${id}] error:`, e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
