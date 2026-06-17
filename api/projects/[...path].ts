import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
})

const updateProjectSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const segments = (req.query.path as string[]) ?? []
  const id = segments[0]

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
    }

    // 4. PUT /api/projects/:id — Admin: update project
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { title, description, status, imageUrl } = updateProjectSchema.parse(req.body)

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (title !== undefined) updates.title = title
      if (description !== undefined) updates.description = description
      if (status !== undefined) updates.status = status
      if (imageUrl !== undefined) updates.image_url = await processImageField(imageUrl)

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
    console.error('Projects error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}