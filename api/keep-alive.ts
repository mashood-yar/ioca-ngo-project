import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabase';
import { allowCors } from './_lib/cors';
import { sendError, sendSuccess } from './_lib/response';

async function handler(req: VercelRequest, res: VercelResponse) {
  // If you want to secure this endpoint specifically for Vercel Cron, you can check:
  // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return sendError(res, 401, 'Unauthorized');
  // }
  // Left open for easy manual testing

  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    // Perform a lightweight query to register API & DB activity on Supabase
    const { error } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Keep-alive ping failed:', error);
      return sendError(res, 500, 'Error pinging database');
    }

    return sendSuccess(res, { message: 'Database pinged successfully to prevent auto-pause.' });
  } catch (error: any) {
    console.error('Keep-alive error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);
