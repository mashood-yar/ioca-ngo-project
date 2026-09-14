import type { VercelRequest, VercelResponse } from '@vercel/node';
import { err } from './response';

const ipCache = new Map<string, { count: number; timestamp: number }>();

export const applyRateLimit = (req: VercelRequest, res: VercelResponse, limit: number = 5, windowMs: number = 60000): boolean => {
  const ip = req.headers['x-forwarded-for'] as string || 'unknown-ip';
  const now = Date.now();
  
  const record = ipCache.get(ip);
  if (!record || (now - record.timestamp > windowMs)) {
    ipCache.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= limit) {
    err(res, 'Too many requests. Please try again later.', 429);
    return false;
  }
  
  record.count += 1;
  return true;
}
