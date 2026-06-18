import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exec } from 'child_process';
import { cors } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Run npx prisma migrate status on the deployment host
  exec('npx prisma migrate status', { env: { ...process.env } }, (error, stdout, stderr) => {
    return res.status(200).json({
      success: !error,
      stdout: stdout || '',
      stderr: stderr || '',
      error: error ? error.message : null
    });
  });
}
