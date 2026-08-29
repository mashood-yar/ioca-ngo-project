import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { allowCors } from '../_lib/cors';
import { err, ok } from '../_lib/response';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return err(res, 405, 'Method not allowed');
  }

  const { uid } = req.query;

  if (!uid || typeof uid !== 'string') {
    return err(res, 400, 'Missing or invalid UID');
  }

  try {
    const { data: person, error } = await supabase
      .from('personnel')
      .select('id, full_name, category, title, profile_image_url, status')
      .eq('uid', uid)
      .single();

    if (error || !person) {
      return err(res, 404, 'Personnel not found');
    }

    return ok(res, person);
  } catch (error: any) {
    console.error('Error verifying personnel:', error);
    return err(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);


