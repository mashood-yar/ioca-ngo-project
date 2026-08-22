import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../_lib/supabase';
import { allowCors } from '../../_lib/cors';
import { sendError, sendSuccess } from '../../_lib/response';
import { verifyAdmin } from '../../_lib/auth';
import { processImageField, uploadBase64Image } from '../../_lib/upload';
import QRCode from 'qrcode';
import crypto from 'crypto';

function generateUid(category: string): string {
  const prefix = category.toUpperCase().substring(0, 3);
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${randomStr}`;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.query.path as string[];
  const route = path ? path[0] : '';

  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) return sendError(res, 401, 'Unauthorized');

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

      if (!['board', 'partner', 'employee', 'volunteer'].includes(category)) {
        return sendError(res, 400, 'Invalid category');
      }

      // Upload profile image if it is base64
      let profile_image_url = null;
      if (profile_image) {
        profile_image_url = await processImageField(profile_image, 'ioca/personnel');
      }

      // Generate UID
      const uid = generateUid(category);

      // Generate QR Code base64 Data URI
      const verifyUrl = `https://ioca.org/verify/${uid}`; // We can assume production domain
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
          full_name,
          email,
          phone,
          profile_image_url,
          qr_code_url,
          status: status || 'active',
          title,
          bio
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
