import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: { method?: string; body: { name?: string; email?: string; message?: string } }, res: { status: (code: number) => { end: () => void; json: (body: unknown) => void } }) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    await resend.emails.send({
      from: 'IOCA Website <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL_TO!,
      subject: `New Contact Form Submission from ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
    await supabase.from('contacts').insert({ name, email, message });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: 'Failed to process contact form' });
  }
}
