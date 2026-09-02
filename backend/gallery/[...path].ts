import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

const createGallerySchema = z.object({
  title: z.string().nullable().optional().or(z.literal('')),
  title_en: z.string().nullable().optional().or(z.literal('')),
  title_ur: z.string().nullable().optional().or(z.literal('')),
  desc_en: z.string().nullable().optional().or(z.literal('')),
  desc_ur: z.string().nullable().optional().or(z.literal('')),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  imagePublicId: z.string().nullable().optional().or(z.literal('')),
  image_public_id: z.string().nullable().optional().or(z.literal('')),
  caption: z.string().nullable().optional().or(z.literal('')),
  category: z.string().nullable().optional().or(z.literal('')),
  sort_order: z.number().nullable().optional(),
  is_featured: z.boolean().nullable().optional(),
})

const updateGallerySchema = createGallerySchema.partial()

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
    // 0. GET /api/gallery/categories â€” Public: list unique categories
    if (req.method === 'GET' && id === 'categories') {
      const { data, error } = await supabase
        .from('gallery')
        .select('category')
        .not('category', 'is', null)

      if (error) throw new Error(error.message)
      const uniqueCategories = Array.from(new Set(data.map((item: any) => item.category)))
      return ok(res, uniqueCategories.filter(Boolean))
    }

    // 1. GET /api/gallery â€” Public: list all gallery images
    if (req.method === 'GET' && !id) {
      const category = req.query.category as string | undefined;
      
      let query = supabase
        .from('gallery')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data: images, error } = await query

      if (error) throw new Error(error.message)
      return ok(res, images)
    }

    // 2. GET /api/gallery/:id â€” Public: get single gallery image
    if (req.method === 'GET' && id && id !== 'categories') {
      const { data: image, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Gallery image not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, image)
    }

    // 3. POST /api/gallery â€” Admin: upload gallery image
    if (req.method === 'POST' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = createGallerySchema.parse(req.body)
      const imageUrl = body.image_url ?? body.imageUrl
      const imagePublicId = body.image_public_id ?? body.imagePublicId

      if (!imageUrl || imageUrl === '') {
        return err(res, 'Image URL is required', 400)
      }

      const { data: image, error } = await supabase
        .from('gallery')
        .insert({
          title: body.title || body.title_en || 'Untitled',
          title_en: body.title_en,
          title_ur: body.title_ur,
          desc_en: body.desc_en,
          desc_ur: body.desc_ur,
          sort_order: body.sort_order ?? 0,
          is_featured: body.is_featured ?? false,
          image_url: await processImageField(imageUrl),
          image_public_id: imagePublicId && imagePublicId !== '' ? imagePublicId : null,
          caption: body.caption && body.caption !== '' ? body.caption : null,
          category: body.category && body.category !== '' ? body.category : null,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, image, 201)
    }

    // 4. PUT /api/gallery/:id â€” Admin: update gallery image
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = updateGallerySchema.parse(req.body)

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.title !== undefined) updates.title = body.title
      if (body.title_en !== undefined) updates.title_en = body.title_en
      if (body.title_ur !== undefined) updates.title_ur = body.title_ur
      if (body.desc_en !== undefined) updates.desc_en = body.desc_en
      if (body.desc_ur !== undefined) updates.desc_ur = body.desc_ur
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order
      if (body.is_featured !== undefined) updates.is_featured = body.is_featured
      if (body.caption !== undefined) updates.caption = body.caption && body.caption !== '' ? body.caption : null
      if (body.category !== undefined) updates.category = body.category && body.category !== '' ? body.category : null

      const imageUrl = body.image_url !== undefined ? body.image_url : body.imageUrl
      if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
        updates.image_url = await processImageField(imageUrl)
      }

      const imagePublicId = body.image_public_id !== undefined ? body.image_public_id : body.imagePublicId
      if (imagePublicId !== undefined) updates.image_public_id = imagePublicId || null

      const { data: image, error } = await supabase
        .from('gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, image)
    }

    // 5. DELETE /api/gallery/:id â€” Admin: delete gallery image
    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Gallery image deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Gallery error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}
