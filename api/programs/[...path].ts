import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000)
}

const createProgramSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['education', 'health', 'youth', 'community_bonding']),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  imagePublicId: z.string().nullable().optional().or(z.literal('')),
  image_public_id: z.string().nullable().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
  slug: z.string().nullable().optional().or(z.literal('')),
  authorId: z.string().uuid().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
})

const updateProgramSchema = createProgramSchema.partial()

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
    // 1. GET /api/programs — Public: list all programs
    if (req.method === 'GET' && !id) {
      const { data: programs, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, programs)
    }

    // 2. GET /api/programs/:id — Public: get single program
    if (req.method === 'GET' && id) {
      const { data: program, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Program not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, program)
    }

    // 3. POST /api/programs — Admin: create program
    if (req.method === 'POST' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = createProgramSchema.parse(req.body)
      const imageUrl = body.image_url ?? body.imageUrl
      const imagePublicId = body.image_public_id ?? body.imagePublicId
      const authorId = body.author_id ?? body.authorId ?? user.id
      const slug = body.slug || slugify(body.title)

      const { data: program, error } = await supabase
        .from('programs')
        .insert({
          title: body.title,
          description: body.description,
          category: body.category,
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
          image_public_id: imagePublicId && imagePublicId !== '' ? imagePublicId : null,
          status: body.status,
          slug: slug || null,
          author_id: authorId || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, program, 201)
    }

    // 4. PUT /api/programs/:id — Admin: update program
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = updateProgramSchema.parse(req.body)

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.title !== undefined && body.title !== null) updates.title = body.title
      if (body.description !== undefined && body.description !== null) updates.description = body.description
      if (body.category !== undefined) updates.category = body.category
      if (body.status !== undefined) updates.status = body.status

      const imageUrl = body.image_url !== undefined ? body.image_url : body.imageUrl
      if (imageUrl !== undefined) updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null

      const imagePublicId = body.image_public_id !== undefined ? body.image_public_id : body.imagePublicId
      if (imagePublicId !== undefined) updates.image_public_id = imagePublicId || null

      if (body.slug !== undefined) {
        updates.slug = body.slug && body.slug !== '' ? body.slug : null
      } else if (body.title !== undefined && body.title !== null) {
        updates.slug = slugify(body.title)
      }

      const authorId = body.author_id !== undefined ? body.author_id : body.authorId
      if (authorId !== undefined) updates.author_id = authorId || null

      const { data: program, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, program)
    }

    // 5. DELETE /api/programs/:id — Admin: delete program
    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Program deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Programs error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}
