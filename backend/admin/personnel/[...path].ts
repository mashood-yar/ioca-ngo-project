import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../_lib/supabase';
import { allowCors } from '../../_lib/cors';
import { err, ok } from '../../_lib/response';
import { requireAdmin } from '../../_lib/auth';
import { processImageField, uploadBase64Image } from '../../_lib/upload';
import { generateCustomQR } from '../../_lib/qrGenerator';
import { getNextSequentialUid } from '../../_lib/personnelUtils';

async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.query.path as string[]) || [];
  const route = path[0] || '';

  try {
    const adminUser = await requireAdmin(req, res);
    if (!adminUser) return;

    if (req.method === 'GET' && route === '') {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) return err(res, 500, 'Error fetching personnel');
      return ok(res, data || []);
    }

    if (req.method === 'POST' && route === '') {
      const { category, full_name, email, phone, profile_image, title, bio, status } = req.body;

      if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
        return err(res, 400, 'Full name is required');
      }
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return err(res, 400, 'Title is required');
      }
      if (!category || !['board', 'partner', 'employee', 'volunteer'].includes(category)) {
        return err(res, 400, 'Invalid category. Must be one of: board, partner, employee, volunteer');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return err(res, 400, 'Invalid email format');
      }

      let profile_image_url = null;
      if (profile_image) {
        profile_image_url = await processImageField(profile_image, 'ioca/personnel');
      }

      // Generate UID with collision retry (uses shared utility)
      let uid = await getNextSequentialUid(category);
      let retries = 0;
      while (retries < 5) {
        const { data: existing } = await supabase
          .from('personnel')
          .select('id')
          .eq('uid', uid)
          .maybeSingle();
        if (!existing) break;

        const parts = uid.split('-');
        const currentNum = parseInt(parts[1], 10);
        uid = `${parts[0]}-${String(currentNum + 1).padStart(3, '0')}`;
        retries++;
      }

      const baseUrl = process.env.CLIENT_URL || 'https://www.iocaworld.org';
      const verifyUrl = `${baseUrl}/verify/${uid}`;
      const logoPath = `${baseUrl}/assets/logos/logo-icon-white.webp`;
      const qrDataUrl = await generateCustomQR(verifyUrl, logoPath);
      const { url: qr_code_url } = await uploadBase64Image(qrDataUrl, 'ioca/qrcodes');

      const { data, error } = await supabase
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

      if (error) return err(res, 500, error.message);
      return ok(res, data);
    }

    if (req.method === 'POST' && route === 'migrate-uids') {
      const { data: allPersonnel, error: fetchErr } = await supabase
        .from('personnel')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchErr) return err(res, 500, 'Error fetching personnel');
      if (!allPersonnel || allPersonnel.length === 0) return ok(res, { message: 'No personnel to migrate' });

      const sequenceMap: Record<string, number> = {};

      let migratedCount = 0;
      const baseUrl = process.env.CLIENT_URL || 'https://www.iocaworld.org';
      const logoPath = `${baseUrl}/assets/logos/logo-icon-white.webp`;

      for (const person of allPersonnel) {
        if (/^[A-Z]{3}-\d{3}$/.test(person.uid)) {
          const prefix = person.uid.split('-')[0];
          const num = parseInt(person.uid.split('-')[1], 10);
          sequenceMap[prefix] = Math.max(sequenceMap[prefix] || 0, num);
          continue;
        }

        const prefix = person.category.toUpperCase().substring(0, 3);
        const nextNum = (sequenceMap[prefix] || 0) + 1;
        sequenceMap[prefix] = nextNum;

        const newUid = `${prefix}-${String(nextNum).padStart(3, '0')}`;

        const verifyUrl = `${baseUrl}/verify/${newUid}`;
        const qrDataUrl = await generateCustomQR(verifyUrl, logoPath);
        const { url: qr_code_url } = await uploadBase64Image(qrDataUrl, 'ioca/qrcodes');

        const { error: updateErr } = await supabase
          .from('personnel')
          .update({ uid: newUid, qr_code_url, updated_at: new Date().toISOString() })
          .eq('id', person.id);

        if (updateErr) {
          console.error(`Failed to migrate ${person.id}:`, updateErr);
        } else {
          migratedCount++;
        }
      }

      return ok(res, { message: `Successfully migrated ${migratedCount} UIDs.` });
    }

    if (req.method === 'POST' && route === 'reorder') {
      const { items } = req.body;
      if (!Array.isArray(items)) return err(res, 400, 'Invalid payload');

      const promises = items.map((i: { id: string; display_order: number }) =>
        supabase.from('personnel').update({ display_order: i.display_order }).eq('id', i.id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) return err(res, 500, error.message);
      return ok(res, { message: 'Reordered successfully' });
    }

    if (req.method === 'PUT' && route) {
      const id = route;
      const { full_name, email, phone, profile_image, title, bio, status } = req.body;

      const { data: existingUser, error: fetchErr } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !existingUser) return err(res, 404, 'Personnel not found');

      let profile_image_url = req.body.profile_image_url;
      if (profile_image && profile_image.startsWith('data:image/')) {
        profile_image_url = await processImageField(profile_image, 'ioca/personnel');
      }

      const baseUrl = process.env.CLIENT_URL || 'https://www.iocaworld.org';
      let qr_code_url = existingUser.qr_code_url;
      if (!qr_code_url && existingUser.uid) {
        const verifyUrlInner = `${baseUrl}/verify/${existingUser.uid}`;
        const logoPath = `${baseUrl}/assets/logos/logo-icon-white.webp`;
        const qrDataUrlInner = await generateCustomQR(verifyUrlInner, logoPath);
        const uploadedQr = await uploadBase64Image(qrDataUrlInner, 'ioca/qrcodes');
        qr_code_url = uploadedQr.url;
      }

      const { data, error } = await supabase
        .from('personnel')
        .update({
          full_name,
          email,
          phone,
          profile_image_url,
          qr_code_url,
          status,
          title,
          bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return err(res, 500, error.message);
      return ok(res, data);
    }

    if (req.method === 'DELETE' && route) {
      const id = route;
      const { data, error } = await supabase
        .from('personnel')
        .update({ status: 'former', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return err(res, 500, error.message);
      return ok(res, data);
    }

    return err(res, 404, 'Not found');
  } catch (error: any) {
    console.error('Personnel API Error:', error);
    return err(res, 500, 'Internal server error');
  }
}

export default allowCors(handler);
