import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
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

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.string().optional().nullable().or(z.literal('')),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  slug: z.string().nullable().optional().or(z.literal('')),
  category: z.string().nullable().optional().or(z.literal('')),
  isFeatured: z.boolean().optional().nullable(),
  is_featured: z.boolean().optional().nullable(),
  startDate: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  start_date: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  endDate: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  end_date: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  authorId: z.string().uuid().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
})

const updateProjectSchema = createProjectSchema.partial()

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
    // 1. GET /api/projects — Public: list all projects
    if (req.method === 'GET' && !id) {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, projects)
    }

    // 2. GET /api/projects/:id — Public: get single project
    if (req.method === 'GET' && id) {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Project not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, project)
    }

    // 3. POST /api/projects — Admin: create project
    if (req.method === 'POST' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = createProjectSchema.parse(req.body)
      const imageUrl = body.image_url ?? body.imageUrl
      const isFeatured = body.is_featured ?? body.isFeatured
      const startDate = body.start_date ?? body.startDate
      const endDate = body.end_date ?? body.endDate
      const authorId = body.author_id ?? body.authorId ?? user.id
      const slug = body.slug || slugify(body.title)

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: body.title,
          description: body.description,
          status: body.status && body.status !== '' ? body.status : 'ongoing',
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
          slug: slug || null,
          category: body.category || null,
          is_featured: isFeatured ?? false,
          start_date: startDate && startDate !== '' ? startDate : null,
          end_date: endDate && endDate !== '' ? endDate : null,
          author_id: authorId || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, project, 201)
    }

    // 4. PUT /api/projects/:id — Admin: update project
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = updateProjectSchema.parse(req.body)

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.title !== undefined && body.title !== null) updates.title = body.title
      if (body.description !== undefined && body.description !== null) updates.description = body.description
      if (body.status !== undefined) updates.status = body.status && body.status !== '' ? body.status : 'ongoing'
      
      const imageUrl = body.image_url !== undefined ? body.image_url : body.imageUrl
      if (imageUrl !== undefined) updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null

      if (body.slug !== undefined) {
        updates.slug = body.slug && body.slug !== '' ? body.slug : null
      } else if (body.title !== undefined && body.title !== null) {
        updates.slug = slugify(body.title)
      }

      if (body.category !== undefined) updates.category = body.category || null
      
      const isFeatured = body.is_featured !== undefined ? body.is_featured : body.isFeatured
      if (isFeatured !== undefined) updates.is_featured = isFeatured ?? false

      const startDate = body.start_date !== undefined ? body.start_date : body.startDate
      if (startDate !== undefined) updates.start_date = startDate && startDate !== '' ? startDate : null

      const endDate = body.end_date !== undefined ? body.end_date : body.endDate
      if (endDate !== undefined) updates.end_date = endDate && endDate !== '' ? endDate : null

      const authorId = body.author_id !== undefined ? body.author_id : body.authorId
      if (authorId !== undefined) updates.author_id = authorId || null

      const { data: project, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, project)
    }

    // 5. DELETE /api/projects/:id — Admin: delete project
    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Project deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Projects error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}
