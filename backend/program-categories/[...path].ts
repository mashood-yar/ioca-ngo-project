import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'

const createCategorySchema = z.object({
  nameEn: z.string().min(1, 'English Name is required'),
  nameUr: z.string().min(1, 'Urdu Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  iconSvg: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
})

const updateCategorySchema = createCategorySchema.partial()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []

  const id = segments[0]

  try {
    // 1. GET /api/program-categories - Public: list all categories
    if (req.method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('program_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      
      return ok(res, data)
    }

    // 2. POST /api/program-categories - Admin: create category
    if (req.method === 'POST' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const validated = createCategorySchema.parse(req.body)

      const { data, error } = await supabase
        .from('program_categories')
        .insert({
          name_en: validated.nameEn,
          name_ur: validated.nameUr,
          slug: validated.slug,
          icon_svg: validated.iconSvg,
          sort_order: validated.sortOrder
        })
        .select()
        .single()

      if (error) throw error
      return ok(res, data, 201)
    }

    // 3. PUT /api/program-categories/:id - Admin: update category
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const validated = updateCategorySchema.parse(req.body)

      const payload: any = {}
      if (validated.nameEn !== undefined) payload.name_en = validated.nameEn
      if (validated.nameUr !== undefined) payload.name_ur = validated.nameUr
      if (validated.slug !== undefined) payload.slug = validated.slug
      if (validated.iconSvg !== undefined) payload.icon_svg = validated.iconSvg
      if (validated.sortOrder !== undefined) payload.sort_order = validated.sortOrder

      const { data, error } = await supabase
        .from('program_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return ok(res, data)
    }

    // 4. DELETE /api/program-categories/:id - Admin: delete category
    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('program_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return ok(res, { deleted: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (error: any) {
    console.error('Program Categories API Error:', error)
    if (error instanceof z.ZodError) {
      return err(res, error.errors[0].message, 400)
    }
    return err(res, error.message || 'Internal server error', 500)
  }
}
