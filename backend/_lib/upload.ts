import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// Initialize Cloudflare R2 Client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const uploadBase64Image = async (
  base64Str: string,
  folder?: string
): Promise<{ url: string; publicId: string }> => {
  try {
    // 1. Extract base64 data
    const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }

    const buffer = Buffer.from(matches[2], 'base64');

    // 2. Convert to WebP using sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // 3. Generate a unique filename
    const prefix = folder ? `${folder}/` : 'ioca/';
    const uniqueId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const fileName = `${prefix}${uniqueId}.webp`;

    // 4. Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'ioca-assets',
      Key: fileName,
      Body: webpBuffer,
      ContentType: 'image/webp'
    });

    await s3Client.send(command);

    // 5. Construct Public URL
    const publicUrl = process.env.R2_PUBLIC_URL || '';
    const url = `${publicUrl}/${fileName}`;

    return {
      url,
      publicId: fileName,
    };
  } catch (error) {
    console.error('Cloudflare R2 Upload Error:', error);
    throw new Error('Failed to upload image to Cloudflare R2');
  }
}

export const processImageField = async (imageUrl?: string, folder?: string): Promise<string | undefined> => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('data:image/')) {
    const { url } = await uploadBase64Image(imageUrl, folder);
    return url;
  }
  return imageUrl;
}
