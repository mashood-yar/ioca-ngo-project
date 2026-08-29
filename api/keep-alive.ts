import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase';
import { allowCors } from './_lib/cors';
import { err, ok } from './_lib/response';

async function handler(req: VercelRequest, res: VercelResponse) {
  // M-07: Verify Vercel Cron secret when configured to prevent abuse
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return err(res, 401, 'Unauthorized');
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return err(res, 405, 'Method not allowed');
  }

  try {
    // Perform a lightweight query to register API & DB activity on Supabase
    const { error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Keep-alive ping failed:', error);
      return err(res, 500, 'Error pinging database');
    }

    return ok(res, { message: 'Database pinged successfully to prevent auto-pause.' });
  } catch (error: any) {
    console.error('Keep-alive error:', error);
    return err(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);


