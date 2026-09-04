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
  titleEn: z.string().min(1, 'English Title is required'),
  titleUr: z.string().min(1, 'Urdu Title is required'),
  descEn: z.string().min(1, 'English Description is required'),
  descUr: z.string().min(1, 'Urdu Description is required'),
  contentEn: z.string().nullable().optional().or(z.literal('')),
  contentUr: z.string().nullable().optional().or(z.literal('')),
  categoryId: z.string().uuid('Invalid Category ID'),
  statsBeneficiaries: z.number().default(0),
  statsProjects: z.number().default(0),
  statsVolunteers: z.number().default(0),
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
        .select('*, category:program_categories(*)')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, programs)
    }

    // 2. GET /api/programs/:id — Public: get single program
    if (req.method === 'GET' && id) {
      let query = supabase.from('programs').select('*, category:program_categories(*)');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data: program, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Program not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, program)
    }

    // 3. POST /api/programs — Admin: create program
    if (req.method === 'POST') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body: any = req.body
      const imageUrl = body.image_url || body.image
      const iconUrl = body.icon_url || body.icon
      const heroImageUrl = body.hero_image_url || body.heroImage

      const { data: program, error } = await supabase
        .from('programs')
        .insert({
          title_en: body.titleEn,
          title_ur: body.titleUr,
          desc_en: body.descEn,
          desc_ur: body.descUr,
          content_en: body.contentEn,
          content_ur: body.contentUr,
          category_id: body.categoryId,
          stats_beneficiaries: body.statsBeneficiaries,
          stats_projects: body.statsProjects,
          stats_volunteers: body.statsVolunteers,
          status: body.status || 'active',
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
          icon_url: iconUrl && iconUrl !== '' ? await processImageField(iconUrl) : null,
          hero_image_url: heroImageUrl && heroImageUrl !== '' ? await processImageField(heroImageUrl) : null,
          slug: slugify(body.titleEn),
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

      const body: any = req.body
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }

      if (body.titleEn !== undefined) {
        updates.title_en = body.titleEn
        if (body.titleEn) updates.slug = slugify(body.titleEn)
      }
      if (body.titleUr !== undefined) updates.title_ur = body.titleUr
      if (body.descEn !== undefined) updates.desc_en = body.descEn
      if (body.descUr !== undefined) updates.desc_ur = body.descUr
      if (body.contentEn !== undefined) updates.content_en = body.contentEn
      if (body.contentUr !== undefined) updates.content_ur = body.contentUr
      if (body.categoryId !== undefined) updates.category_id = body.categoryId
      if (body.statsBeneficiaries !== undefined) updates.stats_beneficiaries = body.statsBeneficiaries
      if (body.statsProjects !== undefined) updates.stats_projects = body.statsProjects
      if (body.statsVolunteers !== undefined) updates.stats_volunteers = body.statsVolunteers
      if (body.status !== undefined) updates.status = body.status

      const imageUrl = body.image_url !== undefined ? body.image_url : body.image
      if (imageUrl !== undefined) {
        updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null
      }
      
      const iconUrl = body.icon_url !== undefined ? body.icon_url : body.icon
      if (iconUrl !== undefined) {
        updates.icon_url = iconUrl && iconUrl !== '' ? await processImageField(iconUrl) : null
      }
      
      const heroImageUrl = body.hero_image_url !== undefined ? body.hero_image_url : body.heroImage
      if (heroImageUrl !== undefined) {
        updates.hero_image_url = heroImageUrl && heroImageUrl !== '' ? await processImageField(heroImageUrl) : null
      }

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
