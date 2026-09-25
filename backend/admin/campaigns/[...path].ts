import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@iocaworld.org';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const pathParts = req.query.path as string[] || [];
  
  try {
    // Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    // Create an authenticated client so RLS policies pass correctly
    const userSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

    // Admin Check
    const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // GET /api/admin/campaigns/audience
    if (method === 'GET' && pathParts[0] === 'audience') {
      const { data, error } = await userSupabase
        .from('audience_contacts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, return empty list gently
          return res.status(200).json({ success: true, data: [] });
        }
        throw error;
      }
      return res.status(200).json({ success: true, data });
    }

    // POST /api/admin/campaigns/send
    if (method === 'POST' && pathParts[0] === 'send') {
      const { subject, html, targetTags } = req.body;
      
      if (!subject || !html) return res.status(400).json({ error: 'Subject and HTML content are required' });
      
      // Fetch target audience
      let query = userSupabase.from('audience_contacts').select('email, first_name').eq('is_subscribed_email', true);
      
      if (targetTags && targetTags.length > 0 && !targetTags.includes('all')) {
        // Match ANY of the tags
        query = query.overlaps('tags', targetTags);
      }
      
      const { data: audience, error } = await query;
      if (error) throw error;
      if (!audience || audience.length === 0) return res.status(400).json({ error: 'No subscribed contacts found for this target' });

      // Prepare standard Resend batch payloads
      const emails = audience.map(contact => ({
        from: \`IOCA Updates <\${FROM_EMAIL}>\`,
        to: contact.email,
        subject: subject,
        html: \`
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            \${html}
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #888; text-align: center;">
              <p>You received this email because you are subscribed to updates from IOCA.</p>
              <p>IOCA - International Organization for Community Advancement</p>
            </div>
          </div>
        \`
      }));

      // Send in batches of 100 max (Resend limitation)
      const chunkSize = 100;
      let sentCount = 0;
      
      for (let i = 0; i < emails.length; i += chunkSize) {
        const chunk = emails.slice(i, i + chunkSize);
        
        // Use Promise.all if batch isn't supported, but resend.batch.send is the official way in v3+
        if (typeof resend.batch?.send === 'function') {
          await resend.batch.send(chunk);
        } else {
          // Fallback if older SDK version
          await Promise.all(chunk.map(email => resend.emails.send(email)));
        }
        sentCount += chunk.length;
      }
      
      return res.status(200).json({ 
        success: true, 
        message: \`Successfully sent campaign to \${sentCount} contacts.\` 
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err: any) {
    console.error('Campaign Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
