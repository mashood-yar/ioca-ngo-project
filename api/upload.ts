import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { ok, err } from './_lib/response'
import { requireAdmin } from './_lib/auth'
import { cors } from './_lib/cors'
import { uploadBase64Image } from './_lib/upload'

const uploadSchema = z.object({
  image: z.string().startsWith('data:image/'),
  folder: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    if (req.method === 'POST') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { image, folder } = uploadSchema.parse(req.body)

      const { url, publicId } = await uploadBase64Image(image, folder)
      return ok(res, { url, publicId }, 201)
    } else {
      return err(res, 'Method not allowed', 405)
    }
  } catch (e) {
    console.error('Upload error:', e)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, e instanceof Error ? e.message : 'Internal server error', 500)
  }
}
