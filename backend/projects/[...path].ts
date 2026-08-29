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
  location: z.string().nullable().optional().or(z.literal('')),
  progress: z.number().int().min(0).max(100).optional().nullable(),
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
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title_en: (body as any).titleEn,
          title_ur: (body as any).titleUr,
          desc_en: (body as any).descEn,
          desc_ur: (body as any).descUr,
          location_en: (body as any).locationEn,
          location_ur: (body as any).locationUr,
          category: body.category,
          status: body.status && body.status !== '' ? body.status : 'ongoing',
          progress: body.progress || 0,
          is_featured: body.is_featured || false,
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
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

      const body: any = req.body

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.titleEn !== undefined) updates.title_en = body.titleEn
      if (body.titleUr !== undefined) updates.title_ur = body.titleUr
      if (body.descEn !== undefined) updates.desc_en = body.descEn
      if (body.descUr !== undefined) updates.desc_ur = body.descUr
      if (body.locationEn !== undefined) updates.location_en = body.locationEn
      if (body.locationUr !== undefined) updates.location_ur = body.locationUr
      if (body.category !== undefined) updates.category = body.category
      if (body.status !== undefined) updates.status = body.status && body.status !== '' ? body.status : 'ongoing'
      if (body.progress !== undefined) updates.progress = body.progress
      if (body.is_featured !== undefined) updates.is_featured = body.is_featured
      if (body.start_date !== undefined) updates.start_date = body.start_date
      if (body.end_date !== undefined) updates.end_date = body.end_date
      
      const imageUrl = body.image_url !== undefined ? body.image_url : body.image
      if (imageUrl !== undefined) {
        updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null
      }

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
