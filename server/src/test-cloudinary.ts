import * as dotenv from 'dotenv';
import path from 'path';
// MUST load dotenv FIRST before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { uploadBase64Image } from './lib/upload';

async function testCloudinary() {
  console.log('Cloudinary env vars:');
  console.log('  CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ MISSING');
  console.log('  API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ set' : '❌ MISSING');
  console.log('  API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ set' : '❌ MISSING');

  const tinyRedPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

  console.log('\nUploading test image to Cloudinary...');
  try {
    const url = await uploadBase64Image(tinyRedPixel);
    console.log('✅ Upload SUCCESS!');
    console.log('  Secure URL:', url);
  } catch (err: any) {
    console.error('❌ Upload FAILED:', err.message);
  }
}

testCloudinary();
