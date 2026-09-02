
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { uploadBase64Image } from '../backend/_lib/upload';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const b64 = req.body.file;
    const result = await uploadBase64Image(b64, 'test');
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}

