import { useState } from 'react';
import { fetchApi } from '../lib/apiClient';

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, folder: string): Promise<{ url: string; publicId: string } | null> => {
    setUploading(true);
    setError(null);

    try {
      // Compress file to base64 using canvas
      const base64Str = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.8 quality to drastically reduce size
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Failed to load image for compression'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      const { data, error: apiError } = await fetchApi<{ url: string; publicId: string }>('/misc/upload', {
        method: 'POST',
        body: JSON.stringify({ file: base64Str, folder }),
      });

      if (apiError || !data) {
        throw new Error(apiError || 'Failed to upload image');
      }

      return data;
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error uploading file');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
