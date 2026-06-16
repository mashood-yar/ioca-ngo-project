import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/**
 * Upload a base64-encoded image to Cloudinary.
 * @param base64Str  The base64 data URI string (e.g. "data:image/png;base64,...")
 * @param folder     Optional subfolder within the Cloudinary account. Defaults to 'ioca'.
 * @returns          Object containing the public CDN URL and the public_id for deletion.
 */
export const uploadBase64Image = async (
  base64Str: string,
  folder?: string
): Promise<{ url: string; publicId: string }> => {
  try {
    const cld = getCloudinary();
    const uploadResponse = await cld.uploader.upload(base64Str, {
      folder: folder ?? 'ioca',
      resource_type: 'auto',
    });
    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Helper used by news/events/projects controllers.
 * If the value is already a hosted URL, return it unchanged.
 * If it's a base64 data URI, upload it and return the CDN URL.
 */
export const processImageField = async (imageUrl?: string, folder?: string): Promise<string | undefined> => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('data:image/')) {
    const { url } = await uploadBase64Image(imageUrl, folder);
    return url;
  }
  return imageUrl;
};
