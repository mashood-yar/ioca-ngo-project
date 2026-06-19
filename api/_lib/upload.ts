import cloudinary from './cloudinary'

/**
 * Upload a base64-encoded image to Cloudinary.
 */
export const uploadBase64Image = async (
  base64Str: string,
  folder?: string
): Promise<{ url: string; publicId: string }> => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: folder ?? 'ioca',
      resource_type: 'auto',
    })
    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    }
  } catch (error) {
    console.error('Cloudinary Upload Error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

/**
 * Helper for news/events/projects.
 * If URL is already hosted, return unchanged.
 * If base64 data URI, upload to Cloudinary and return CDN URL.
 */
export const processImageField = async (imageUrl?: string, folder?: string): Promise<string | undefined> => {
  if (!imageUrl) return undefined
  if (imageUrl.startsWith('data:image/')) {
    const { url } = await uploadBase64Image(imageUrl, folder)
    return url
  }
  return imageUrl
}
