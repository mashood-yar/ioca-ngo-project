import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../_lib/supabase';
import { allowCors } from '../../_lib/cors';
import { sendError, sendSuccess } from '../../_lib/response';
import { requireAdmin } from '../../_lib/auth';
import { processImageField, uploadBase64Image } from '../../_lib/upload';
import QRCode from 'qrcode';
import crypto from 'crypto';

function generateUid(category: string): string {
  const prefix = category.toUpperCase().substring(0, 3);
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${randomStr}`;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.query.path as string[];
  const route = path ? path[0] : '';

  try {
    const adminUser = await requireAdmin(req, res);
    if (!adminUser) return; // requireAdmin already sent 401/403

    if (req.method === 'GET' && route === '') {
      // List all personnel
      const { data, error } = await supabaseAdmin
        .from('personnel')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return sendError(res, 500, 'Error fetching personnel');
      return sendSuccess(res, data || []);
    }

    if (req.method === 'POST' && route === '') {
      // Create personnel
      const { category, full_name, email, phone, profile_image, title, bio, status } = req.body;

      // H-01: Validate required fields
      if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
        return sendError(res, 400, 'Full name is required');
      }
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return sendError(res, 400, 'Title is required');
      }
      if (!category || !['board', 'partner', 'employee', 'volunteer'].includes(category)) {
        return sendError(res, 400, 'Invalid category. Must be one of: board, partner, employee, volunteer');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendError(res, 400, 'Invalid email format');
      }

      // Upload profile image if it is base64
      let profile_image_url = null;
      if (profile_image) {
        profile_image_url = await processImageField(profile_image, 'ioca/personnel');
      }

      // Generate UID with collision retry
      let uid = generateUid(category);
      let retries = 0;
      while (retries < 5) {
        const { data: existing } = await supabaseAdmin
          .from('personnel')
          .select('id')
          .eq('uid', uid)
          .maybeSingle();
        if (!existing) break;
        uid = generateUid(category);
        retries++;
      }

      // H-03: Use environment variable for base URL instead of hardcoded domain
      const baseUrl = process.env.SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ioca.org');
      const verifyUrl = `${baseUrl}/verify/${uid}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        color: { dark: '#0a2540', light: '#ffffff' }
      });
      
      // Upload QR Code to Cloudinary
      const { url: qr_code_url } = await uploadBase64Image(qrDataUrl, 'ioca/qrcodes');

      const { data, error } = await supabaseAdmin
        .from('personnel')
        .insert([{
          category,
          uid,
          full_name: full_name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          profile_image_url,
          qr_code_url,
          status: status || 'active',
          title: title.trim(),
          bio: bio?.trim() || null
        }])
        .select()
        .single();

      if (error) return sendError(res, 500, error.message);
      return sendSuccess(res, data);
    }

    if (req.method === 'PUT' && route) {
      // Update personnel (id is in route)
      const id = route;
      const { full_name, email, phone, profile_image, title, bio, status } = req.body;

      let profile_image_url = req.body.profile_image_url;
      if (profile_image && profile_image.startsWith('data:image/')) {
        profile_image_url = await processImageField(profile_image, 'ioca/personnel');
      }

      const { data, error } = await supabaseAdmin
        .from('personnel')
        .update({
          full_name,
          email,
          phone,
          profile_image_url,
          status,
          title,
          bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return sendError(res, 500, error.message);
      return sendSuccess(res, data);
    }

    if (req.method === 'DELETE' && route) {
      // Instead of DELETE, we change status to 'former'
      const id = route;
      const { data, error } = await supabaseAdmin
        .from('personnel')
        .update({ status: 'former', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return sendError(res, 500, error.message);
      return sendSuccess(res, data);
    }

    return sendError(res, 404, 'Not found');
  } catch (error: any) {
    console.error('Personnel API Error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);
