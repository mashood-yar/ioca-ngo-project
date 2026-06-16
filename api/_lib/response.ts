import type { VercelResponse } from '@vercel/node'

export const ok = (res: VercelResponse, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data })

export const err = (res: VercelResponse, message: string, status = 500) =>
  res.status(status).json({ success: false, error: message })
