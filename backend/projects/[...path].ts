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

async function generateUniqueSlug(table: string, title: string, excludeId?: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    let query = supabase.from(table).select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    
    const { data } = await query.maybeSingle();
    if (!data) break; // Unique
    
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}

const createProjectSchema = z.object({
  titleEn: z.string().min(1, 'English Title is required'),
  titleUr: z.string().min(1, 'Urdu Title is required'),
  descEn: z.string().min(1, 'English Description is required'),
  descUr: z.string().min(1, 'Urdu Description is required'),
  status: z.string().optional().nullable().or(z.literal('')),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  slug: z.string().nullable().optional().or(z.literal('')),
  category: z.string().nullable().optional().or(z.literal('')),
  locationEn: z.string().nullable().optional().or(z.literal('')),
  locationUr: z.string().nullable().optional().or(z.literal('')),
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
      const { is_featured, limit, status } = req.query
      
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (is_featured === 'true') {
        query = query.eq('is_featured', true)
      }
      
      if (status) {
        const statuses = (status as string).split(',');
        if (statuses.length > 1) {
          query = query.in('status', statuses);
        } else {
          query = query.eq('status', status as string);
        }
      }
      
      if (limit) {
        query = query.limit(parseInt(limit as string, 10))
      }

      const { data: projects, error } = await query

      if (error) throw new Error(error.message)
      return ok(res, projects)
    }

    // 2. GET /api/projects/:id — Public: get single project
    if (req.method === 'GET' && id && id !== 'assigned' && id !== 'candidates' && segments[1] !== 'team') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let query = supabase.from('projects').select('*');
      
      if (uuidRegex.test(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data: project, error } = await query.single();

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
          title: body.titleEn,
          description: body.descEn,
          title_en: body.titleEn,
          title_ur: body.titleUr,
          desc_en: body.descEn,
          desc_ur: body.descUr,
          location_en: body.locationEn,
          location_ur: body.locationUr,
          category: body.category,
          status: body.status && body.status !== '' ? body.status : 'ongoing',
          progress: body.progress || 0,
          is_featured: body.is_featured || false,
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
          slug: await generateUniqueSlug('projects', body.titleEn, id),
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

      const body = req.body as Record<string, unknown>

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.titleEn !== undefined) {
        updates.title_en = body.titleEn
        updates.title = body.titleEn
        if (body.titleEn) updates.slug = await generateUniqueSlug('projects', body.titleEn, id)
      }
      if (body.titleUr !== undefined) updates.title_ur = body.titleUr
      if (body.descEn !== undefined) {
        updates.desc_en = body.descEn
        updates.description = body.descEn
      }
      if (body.descUr !== undefined) updates.desc_ur = body.descUr
      if (body.locationEn !== undefined) updates.location_en = body.locationEn
      if (body.locationUr !== undefined) updates.location_ur = body.locationUr
      if (body.category !== undefined) updates.category = body.category
      if (body.status !== undefined) updates.status = body.status && body.status !== '' ? body.status : 'ongoing'
      if (body.progress !== undefined) updates.progress = body.progress
      if (body.is_featured !== undefined) updates.is_featured = body.is_featured
      if (body.start_date !== undefined) updates.start_date = body.start_date
      if (body.end_date !== undefined) updates.end_date = body.end_date
      
      const imageUrl = body.image_url !== undefined ? body.image_url : (body.imageUrl !== undefined ? body.imageUrl : body.image)
      if (imageUrl !== undefined) {
        updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl as string) : null
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

    // 6. GET /api/projects/assigned — Logged-in user gets their assigned projects
    if (req.method === 'GET' && id === 'assigned') {
      const authHeader = req.headers.authorization
      if (!authHeader) return err(res, 'Unauthorized', 401)
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      
      if (userError || !user) return err(res, 'Unauthorized', 401)

      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          id, role, assigned_at,
          projects (*)
        `)
        .eq('user_id', user.id)

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // GET /api/projects/candidates — Admin views all members and volunteers to assign
    if (req.method === 'GET' && id === 'candidates') {
      const adminUser = await requireAdmin(req, res)
      if (!adminUser) return
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name', { ascending: true })

      if (error) throw new Error(error.message)

      // Map emails from auth.users
      const { data: authData } = await supabase.auth.admin.listUsers()
      const usersMap = new Map()
      if (authData?.users) {
        authData.users.forEach((u: any) => usersMap.set(u.id, u.email))
      }

      const validProfiles = profiles?.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: usersMap.get(p.id) || '',
        role: p.role,
        is_volunteer: p.role === 'volunteer'
      })).filter((p: any) => p.email && p.full_name) || []

      return ok(res, validProfiles)
    }

    // 7. GET /api/projects/:id/team — Admin views assigned users for a project
    if (req.method === 'GET' && id && id !== 'assigned' && segments[1] === 'team') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          id, role, assigned_at,
          user_id,
          profiles (full_name, avatar_url, phone)
        `)
        .eq('project_id', id)

      if (error) throw new Error(error.message)

      const { data: authData } = await supabase.auth.admin.listUsers()
      const usersMap = new Map()
      if (authData?.users) {
        authData.users.forEach((u: any) => usersMap.set(u.id, u.email))
      }

      const formatted = data?.map((assignment: any) => ({
        ...assignment,
        profiles: {
          ...(Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles),
          email: usersMap.get(assignment.user_id) || 'Unknown'
        }
      })) || []

      return ok(res, formatted)
    }

    // 8. POST /api/projects/:id/team — Admin assigns or unassigns a user
    if (req.method === 'POST' && id && id !== 'assigned' && segments[1] === 'team') {
      const adminUser = await requireAdmin(req, res)
      if (!adminUser) return

      const { action, user_id, email, role } = req.body as { action: 'assign' | 'unassign', user_id?: string, email?: string, role?: string }
      
      let targetUserId = user_id;
      if (!targetUserId && email) {
        const { data: authData } = await supabase.auth.admin.listUsers()
        const foundUser = authData?.users?.find((u: any) => u.email === email)
        if (foundUser) targetUserId = foundUser.id;
      }

      if (!targetUserId) return err(res, 'User not found. Ensure they have registered an account with this email.', 404)

      if (action === 'unassign') {
        const { error } = await supabase.from('project_assignments').delete().match({ project_id: id, user_id: targetUserId })
        if (error) throw new Error(error.message)
        return ok(res, { message: 'Unassigned successfully' })
      } else {
        const { error } = await supabase.from('project_assignments').upsert({
          project_id: id,
          user_id: targetUserId,
          role: role || 'volunteer'
        }, { onConflict: 'project_id,user_id' })
        if (error) throw new Error(error.message)
        return ok(res, { message: 'Assigned successfully' })
      }
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
