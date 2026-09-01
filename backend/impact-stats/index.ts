import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  // Extract optional /:id from query path
  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []
  const id = segments[0] === 'index' ? undefined : segments[0]

  try {
    // ── GET /api/impact-stats ───────────────────────────────────────────────
    // Public: returns all active stats ordered by sort_order
    if (req.method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('impact_stats')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // ── POST /api/impact-stats ──────────────────────────────────────────────
    // Admin only: create a new stat
    if (req.method === 'POST' && !id) {
      if (!(await requireAdmin(req, res))) return

      const { label_en, label_ur, value, suffix, icon, color, sort_order } = req.body

      if (!label_en || !label_ur || value === undefined) {
        return err(res, 'label_en, label_ur, and value are required', 400)
      }

      const { data, error } = await supabase
        .from('impact_stats')
        .insert([{ label_en, label_ur, value: Number(value), suffix: suffix ?? '+', icon: icon ?? 'HeartPulse', color: color ?? 'teal', sort_order: sort_order ?? 0 }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data, 201)
    }

    // ── PATCH /api/impact-stats/:id ─────────────────────────────────────────
    // Admin only: update a stat
    if (req.method === 'PATCH' && id) {
      if (!(await requireAdmin(req, res))) return

      const { label_en, label_ur, value, suffix, icon, color, sort_order, is_active } = req.body

      const updates: Record<string, unknown> = {}
      if (label_en !== undefined) updates.label_en = label_en
      if (label_ur !== undefined) updates.label_ur = label_ur
      if (value !== undefined) updates.value = Number(value)
      if (suffix !== undefined) updates.suffix = suffix
      if (icon !== undefined) updates.icon = icon
      if (color !== undefined) updates.color = color
      if (sort_order !== undefined) updates.sort_order = sort_order
      if (is_active !== undefined) updates.is_active = is_active

      const { data, error } = await supabase
        .from('impact_stats')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // ── DELETE /api/impact-stats/:id ────────────────────────────────────────
    // Admin only: delete a stat
    if (req.method === 'DELETE' && id) {
      if (!(await requireAdmin(req, res))) return

      const { error } = await supabase
        .from('impact_stats')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return ok(res, { deleted: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[impact-stats]', message)
    return err(res, message)
  }
}
