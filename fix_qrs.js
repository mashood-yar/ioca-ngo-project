import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
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

async function generateCustomQR(url, logoPath) {
  const qrc = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const size = qrc.modules.size;
  const data = qrc.modules.data;
  
  const cellSize = 12;
  const margin = 2;
  const width = (size + margin * 2) * cellSize;
  
  const bg = '#162842'; // Dark Navy
  const fg = '#ffffff'; // White
  const eyeOuter = '#5792c3'; // Light Blue
  const eyeInner = '#c9962a'; // Gold
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">
  <rect width="${width}" height="${width}" fill="${bg}" rx="30" />`;
  
  const centerStart = Math.floor(size / 2) - 4;
  const centerEnd = Math.floor(size / 2) + 4;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isDark = data[row * size + col];
      if (!isDark) continue;
      
      const isTopLeftEye = row < 7 && col < 7;
      const isTopRightEye = row < 7 && col >= size - 7;
      const isBottomLeftEye = row >= size - 7 && col < 7;
      
      if (isTopLeftEye || isTopRightEye || isBottomLeftEye) continue;
      
      if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) continue;
      
      const x = (col + margin) * cellSize;
      const y = (row + margin) * cellSize;
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fg}" rx="3" />`;
    }
  }
  
  const drawEye = (startRow, startCol) => {
    const x = (startCol + margin) * cellSize;
    const y = (startRow + margin) * cellSize;
    const eyeSize = 7 * cellSize;
    const center = eyeSize / 2;
    
    return `
      <!-- Outer circle -->
      <circle cx="${x + center}" cy="${y + center}" r="${center}" fill="${eyeOuter}" />
      <!-- Inner cutout -->
      <circle cx="${x + center}" cy="${y + center}" r="${center - cellSize}" fill="${bg}" />
      <!-- Center dot -->
      <circle cx="${x + center}" cy="${y + center}" r="${1.5 * cellSize}" fill="${eyeInner}" />
    `;
  };
  
  svg += drawEye(0, 0);
  svg += drawEye(0, size - 7);
  svg += drawEye(size - 7, 0);
  
  svg += `</svg>`;
  
  const svgBuffer = Buffer.from(svg);
  
  if (logoPath) {
    try {
      let logoBuffer;
      if (logoPath.startsWith('http')) {
        const res = await fetch(logoPath);
        const arrayBuffer = await res.arrayBuffer();
        logoBuffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error('Logo not found');
      }

      const logoSize = 9 * cellSize;
      
      const logoBg = Buffer.from(`
        <svg width="${logoSize}" height="${logoSize}">
          <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize/2}" fill="${bg}" />
        </svg>
      `);
      
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize - 20, logoSize - 20, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
        .toBuffer();
        
      const finalImage = await sharp(svgBuffer)
        .composite([
          { input: logoBg, gravity: 'center' },
          { input: resizedLogo, gravity: 'center' }
        ])
        .png()
        .toBuffer();
        
      return `data:image/png;base64,${finalImage.toString('base64')}`;
    } catch (e) {
      console.error('Failed to load logo, falling back to logo-less QR', e);
    }
  }
  
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}

async function fixQRCodes() {
  console.log('Fetching all personnel...');
  const { data: personnel, error } = await supabase.from('personnel').select('*');
  if (error) { console.error('Error:', error); return; }

  for (const p of personnel) {
    if (!p.uid) continue;
    console.log(`Processing ${p.uid}...`);
    try {
      const qrDataUrl = await generateCustomQR(`https://iocaworld.org/verify/${p.uid}`, 'https://iocaworld.org/assets/logos/logo-icon-white.webp');
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
