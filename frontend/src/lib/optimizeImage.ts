type ImageOptions = {
  width?: number;
  quality?: 'auto' | number;
};

export function optimizeImage(url: string | null | undefined, options: ImageOptions = {}): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url; // not a Cloudinary URL, return as-is

  const { width, quality = 'auto' } = options;
  const transforms = [`q_${quality}`, 'f_auto'];
  if (width) transforms.push(`w_${width}`);

  // Insert transformations after '/upload/' segment
  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}
