import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAuth, requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  imageUrl: z.string().optional(),
})

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const segments = (req.query.path as string[]) ?? []
  const id = segments[0] === 'index' ? undefined : segments[0]
  const action = segments[1]

  try {
    // 1. GET /api/events — Public: list all events
    if (req.method === 'GET' && !id) {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, events)
    }

    // 2. GET /api/events/:id — Public: get single event
    if (req.method === 'GET' && id && !action) {
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
    }

    // 3. POST /api/events — Admin: create event
    if (req.method === 'POST' && !id) {
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
    }

    // 4. POST /api/events/:id/register — User: register for an event
    if (req.method === 'POST' && id && action === 'register') {
      const user = await requireAuth(req, res)
      if (!user) return

      const { data: registration, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique violation
          return err(res, 'Already registered for this event', 409)
        }
        throw new Error(error.message)
      }

      return ok(res, registration, 201)
    }

    // 5. PUT /api/events/:id — Admin: update event
    if (req.method === 'PUT' && id && !action) {
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
    }

    // 6. DELETE /api/events/:id — Admin: delete event
    if (req.method === 'DELETE' && id && !action) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Event deleted' })
    }

    // 7. DELETE /api/events/:id/unregister — User: unregister from event
    if (req.method === 'DELETE' && id && action === 'unregister') {
      const user = await requireAuth(req, res)
      if (!user) return

      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .match({ event_id: id, user_id: user.id })

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Successfully unregistered from event' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    console.error('Events error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
