import type { VercelResponse } from '@vercel/node'

export const ok = (res: VercelResponse, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data })

export const err = (res: VercelResponse, arg1: any, arg2?: any) => {
  let status = 500;
  let message = 'Internal Server Error';
  
  if (typeof arg1 === 'number') {
    status = arg1;
    message = arg2 || message;
  } else if (typeof arg1 === 'string') {
    message = arg1;
    status = arg2 || 500;
  }
  
  return res.status(status).json({ success: false, error: message })
}
