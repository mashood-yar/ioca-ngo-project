import { useState } from 'react';
import { fetchApi } from '../lib/apiClient';

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, folder: string): Promise<{ url: string; publicId: string } | null> => {
    setUploading(true);
    setError(null);

    try {
      // Convert file to base64
      const base64Str = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
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
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
