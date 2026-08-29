import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAuth, requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const toIsoString = (val: unknown) => {
  if (typeof val === 'string' && val) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return val;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000)
}

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().nullable().optional().or(z.literal('')),
  eventDate: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  event_date: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  isPublished: z.boolean().optional().nullable(),
  is_published: z.boolean().optional().nullable(),
  authorId: z.string().uuid().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  endDate: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  end_date: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  isOnline: z.boolean().optional().nullable(),
  is_online: z.boolean().optional().nullable(),
  meetingUrl: z.string().nullable().optional().or(z.literal('')),
  meeting_url: z.string().nullable().optional().or(z.literal('')),
  capacity: z.number().int().optional().nullable(),
  slug: z.string().nullable().optional().or(z.literal('')),
})

const updateEventSchema = createEventSchema.partial()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== api/events handler invoked ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Path:', req.query.path)
  console.log('Body:', JSON.stringify(req.body))

  if (cors(req, res)) return

  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []
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

      const body = createEventSchema.parse(req.body)
      const eventDate = body.event_date ?? body.eventDate
      const imageUrl = body.image_url ?? body.imageUrl
      const isPublished = body.is_published ?? body.isPublished
      const authorId = body.author_id ?? body.authorId ?? user.id
      const endDate = body.end_date ?? body.endDate
      const isOnline = body.is_online ?? body.isOnline
      const meetingUrl = body.meeting_url ?? body.meetingUrl
      const slug = body.slug || slugify(body.title)

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          title: body.title,
          description: body.description,
          location: body.location && body.location !== '' ? body.location : null,
          event_date: eventDate && eventDate !== '' ? eventDate : null,
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
          is_published: isPublished ?? false,
          author_id: authorId || null,
          end_date: endDate && endDate !== '' ? endDate : null,
          is_online: isOnline ?? false,
          meeting_url: meetingUrl && meetingUrl !== '' ? meetingUrl : null,
          capacity: body.capacity ?? null,
          slug: slug || null,
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

      const body = updateEventSchema.parse(req.body)

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.title !== undefined && body.title !== null) updates.title = body.title
      if (body.description !== undefined && body.description !== null) updates.description = body.description
      if (body.location !== undefined) updates.location = body.location && body.location !== '' ? body.location : null
      
      const eventDate = body.event_date !== undefined ? body.event_date : body.eventDate
      if (eventDate !== undefined) updates.event_date = eventDate && eventDate !== '' ? eventDate : null

      const imageUrl = body.image_url !== undefined ? body.image_url : body.imageUrl
      if (imageUrl !== undefined) updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null

      const isPublished = body.is_published !== undefined ? body.is_published : body.isPublished
      if (isPublished !== undefined) updates.is_published = isPublished ?? false

      const authorId = body.author_id !== undefined ? body.author_id : body.authorId
      if (authorId !== undefined) updates.author_id = authorId || null

      const endDate = body.end_date !== undefined ? body.end_date : body.endDate
      if (endDate !== undefined) updates.end_date = endDate && endDate !== '' ? endDate : null

      const isOnline = body.is_online !== undefined ? body.is_online : body.isOnline
      if (isOnline !== undefined) updates.is_online = isOnline ?? false

      const meetingUrl = body.meeting_url !== undefined ? body.meeting_url : body.meetingUrl
      if (meetingUrl !== undefined) updates.meeting_url = meetingUrl && meetingUrl !== '' ? meetingUrl : null

      if (body.capacity !== undefined) updates.capacity = body.capacity ?? null
      
      if (body.slug !== undefined) {
        updates.slug = body.slug && body.slug !== '' ? body.slug : null
      } else if (body.title !== undefined && body.title !== null) {
        updates.slug = slugify(body.title)
      }

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
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Events error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}
