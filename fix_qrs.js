import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let cleanEndpoint = process.env.R2_ENDPOINT || '';
if (cleanEndpoint.endsWith('/' + process.env.R2_BUCKET_NAME)) {
  cleanEndpoint = cleanEndpoint.replace('/' + process.env.R2_BUCKET_NAME, '');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: cleanEndpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const uploadBase64Image = async (base64Str, folder = '') => {
  const matches = base64Str.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  const extension = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: `image/${extension}`,
  });

  await s3Client.send(command);
  return { url: `${process.env.R2_PUBLIC_URL}/${filename}` };
};

async function fixQRCodes() {
  console.log('Fetching all personnel...');
  const { data: personnel, error } = await supabase.from('personnel').select('*');
  if (error) { console.error('Error:', error); return; }

  for (const p of personnel) {
    if (!p.uid) continue;
    console.log(`Processing ${p.uid}...`);
    try {
      const qrDataUrl = await QRCode.toDataURL(`https://iocaworld.org/verify/${p.uid}`, {
        color: { dark: '#0a2540', light: '#ffffff' },
        margin: 2
      });
      const uploadedQr = await uploadBase64Image(qrDataUrl, 'ioca/qrcodes');
      const { error: updateError } = await supabase.from('personnel').update({ qr_code_url: uploadedQr.url }).eq('id', p.id);
      if (updateError) console.error(`Failed DB for ${p.uid}:`, updateError);
      else console.log(`Successfully updated ${p.uid}`);
    } catch (err) {
      console.error(`Failed processing ${p.uid}:`, err);
    }
  }
}

fixQRCodes();
