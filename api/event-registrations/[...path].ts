import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../misc/[...path]';

export default async (req: VercelRequest, res: VercelResponse) => {
  const originalUrl = req.url!;
  req.url = originalUrl.replace('/api/event-registrations', '/api/misc');
  req.query.path = ['event-registrations', ...((req.query.path as string[]) || [])];
  return handler(req, res);
};
