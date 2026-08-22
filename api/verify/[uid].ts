import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { allowCors } from '../_lib/cors';
import { sendError, sendSuccess } from '../_lib/response';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { uid } = req.query;

  if (!uid || typeof uid !== 'string') {
    return sendError(res, 400, 'Missing or invalid UID');
  }

  try {
    const { data: person, error } = await supabaseAdmin
      .from('personnel')
      .select('id, full_name, category, title, profile_image_url, status')
      .eq('uid', uid)
      .single();

    if (error || !person) {
      return sendError(res, 404, 'Personnel not found');
    }

    return sendSuccess(res, person);
  } catch (error: any) {
    console.error('Error verifying personnel:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);
