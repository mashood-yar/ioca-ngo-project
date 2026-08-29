import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { allowCors } from '../_lib/cors';
import { err, ok } from '../_lib/response';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return err(res, 405, 'Method not allowed');
  }

  try {
    const { data: team, error } = await supabase
      .from('personnel')
      .select('id, full_name, category, title, profile_image_url, bio')
      .in('category', ['board', 'partner'])
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      return err(res, 500, 'Error fetching team');
    }

    return ok(res, team || []);
  } catch (error: any) {
    console.error('Error fetching team:', error);
    return err(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);


