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

const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  image_url: z.string().nullable().optional().or(z.literal('')),
  excerpt: z.string().nullable().optional().or(z.literal('')),
  slug: z.string().nullable().optional().or(z.literal('')),
  isPublished: z.boolean().optional().nullable(),
  is_published: z.boolean().optional().nullable(),
  authorId: z.string().uuid().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  publishedAt: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
  published_at: z.preprocess(toIsoString, z.string().datetime().nullable().optional().or(z.literal(''))),
})

const updateNewsSchema = createNewsSchema.partial()

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
    // 1. GET /api/news — Public: list all news articles
    if (req.method === 'GET' && !id) {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, news)
    }

    // 2. GET /api/news/:id — Public: get single news article
    if (req.method === 'GET' && id) {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'News article not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, news)
    }

    // 3. POST /api/news — Admin: create news article
    if (req.method === 'POST' && !id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = createNewsSchema.parse(req.body)
      const imageUrl = body.image_url ?? body.imageUrl
      const isPublished = body.is_published ?? body.isPublished
      const authorId = body.author_id ?? body.authorId ?? user.id
      const publishedAt = body.published_at ?? body.publishedAt ?? new Date().toISOString()
      const slug = body.slug || slugify(body.title)

      const { data: news, error } = await supabase
        .from('news')
        .insert({
          title: body.title,
          content: body.content,
          image_url: imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null,
          excerpt: body.excerpt || null,
          slug: slug || null,
          is_published: isPublished ?? false,
          author_id: authorId || null,
          published_at: publishedAt && publishedAt !== '' ? publishedAt : null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, news, 201)
    }

    // 4. PUT /api/news/:id — Admin: update news article
    if (req.method === 'PUT' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const body = updateNewsSchema.parse(req.body)

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      }
      if (body.title !== undefined && body.title !== null) updates.title = body.title
      if (body.content !== undefined && body.content !== null) updates.content = body.content
      
      const imageUrl = body.image_url !== undefined ? body.image_url : body.imageUrl
      if (imageUrl !== undefined) updates.image_url = imageUrl && imageUrl !== '' ? await processImageField(imageUrl) : null

      if (body.excerpt !== undefined) updates.excerpt = body.excerpt || null
      
      if (body.slug !== undefined) {
        updates.slug = body.slug && body.slug !== '' ? body.slug : null
      } else if (body.title !== undefined && body.title !== null) {
        updates.slug = slugify(body.title)
      }

      const isPublished = body.is_published !== undefined ? body.is_published : body.isPublished
      if (isPublished !== undefined) updates.is_published = isPublished ?? false

      const authorId = body.author_id !== undefined ? body.author_id : body.authorId
      if (authorId !== undefined) updates.author_id = authorId || null

      const publishedAt = body.published_at !== undefined ? body.published_at : body.publishedAt
      if (publishedAt !== undefined) updates.published_at = publishedAt && publishedAt !== '' ? publishedAt : null

      const { data: news, error } = await supabase
        .from('news')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, news)
    }

    // 5. DELETE /api/news/:id — Admin: delete news article
    if (req.method === 'DELETE' && id) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'News article deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('News error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}
