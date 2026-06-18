import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../misc/[...path]';

export default async (req: VercelRequest, res: VercelResponse) => {
  const originalUrl = req.url!;
  req.url = originalUrl.replace('/api/memberships', '/api/misc');
  req.query.path = ['memberships', ...((req.query.path as string[]) || [])];
  return handler(req, res);
};
