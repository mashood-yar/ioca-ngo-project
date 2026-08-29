import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { processImageField } from '../_lib/upload'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    // ── GET /api/site-settings ──────────────────────────────────────────────
    // Public: returns all settings as { key: value } flat object
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')

      if (error) throw new Error(error.message)

      // Transform [{key, value}, ...] → { key: value, ... }
      const settings: Record<string, string> = {}
      for (const row of data ?? []) {
        settings[row.key] = row.value
      }

      return ok(res, settings)
    }

    // ── PATCH /api/site-settings ────────────────────────────────────────────
    // Admin only: upsert one or more settings
    // Body: { key: value, key2: value2, ... }
    if (req.method === 'PATCH') {
      if (await requireAdmin(req, res)) return

      const updates = req.body as Record<string, string>
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return err(res, 'Request body must be a key-value object', 400)
      }

      // Handle logo upload if base64 data URI is provided
      if (updates.logo_url && updates.logo_url.startsWith('data:image/')) {
        const { url } = await processImageField(updates.logo_url, 'logos') as any
        if (url) updates.logo_url = url
      }
      if (updates.logo_url_white && updates.logo_url_white.startsWith('data:image/')) {
        const { url } = await processImageField(updates.logo_url_white, 'logos') as any
        if (url) updates.logo_url_white = url
      }

      const rows = Object.entries(updates).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from('site_settings')
        .upsert(rows, { onConflict: 'key' })
        .select()

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    return err(res, 'Method not allowed', 405)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[site-settings]', message)
    return err(res, message)
  }
}
