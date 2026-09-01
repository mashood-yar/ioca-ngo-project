import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'

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
    // ── GET /api/testimonials ───────────────────────────────────────────────
    // Public: returns all active testimonials ordered by sort_order
    if (req.method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // ── POST /api/testimonials ──────────────────────────────────────────────
    // Admin only: create a new testimonial
    if (req.method === 'POST' && !id) {
      if (!(await requireAdmin(req, res))) return

      const { quote_en, quote_ur, name_en, name_ur, location_en, location_ur, initial, bg_color, sort_order } = req.body

      if (!quote_en || !quote_ur || !name_en || !name_ur || !location_en || !location_ur || !initial) {
        return err(res, 'All text fields are required', 400)
      }
      if (initial.length !== 1) {
        return err(res, 'initial must be exactly 1 character', 400)
      }

      const { data, error } = await supabase
        .from('testimonials')
        .insert([{
          quote_en, quote_ur, name_en, name_ur,
          location_en, location_ur,
          initial: initial.toUpperCase(),
          bg_color: bg_color ?? 'white',
          sort_order: sort_order ?? 0,
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data, 201)
    }

    // ── PATCH /api/testimonials/:id ─────────────────────────────────────────
    // Admin only: update a testimonial
    if (req.method === 'PATCH' && id) {
      if (!(await requireAdmin(req, res))) return

      const { quote_en, quote_ur, name_en, name_ur, location_en, location_ur, initial, bg_color, sort_order, is_active } = req.body

      const updates: Record<string, unknown> = {}
      if (quote_en !== undefined) updates.quote_en = quote_en
      if (quote_ur !== undefined) updates.quote_ur = quote_ur
      if (name_en !== undefined) updates.name_en = name_en
      if (name_ur !== undefined) updates.name_ur = name_ur
      if (location_en !== undefined) updates.location_en = location_en
      if (location_ur !== undefined) updates.location_ur = location_ur
      if (initial !== undefined) updates.initial = String(initial).toUpperCase()[0]
      if (bg_color !== undefined) updates.bg_color = bg_color
      if (sort_order !== undefined) updates.sort_order = sort_order
      if (is_active !== undefined) updates.is_active = is_active

      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // ── DELETE /api/testimonials/:id ────────────────────────────────────────
    // Admin only: delete a testimonial
    if (req.method === 'DELETE' && id) {
      if (!(await requireAdmin(req, res))) return

      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { deleted: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[testimonials]', message)
    return err(res, message)
  }
}
