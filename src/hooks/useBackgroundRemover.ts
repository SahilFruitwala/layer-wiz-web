
import { useState, useCallback } from 'react';

export function useBackgroundRemover() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeBackground = useCallback(async (imageSrc: string | Blob | File) => {
    setIsLoading(true);
    setError(null);
    try {
      // Convert to File/Blob for API upload
      let file: File | Blob;
      
      if (typeof imageSrc === 'string') {
        // Fetch the image from URL/data URL
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        file = new File([blob], 'image.png', { type: blob.type });
      } else {
        file = imageSrc;
      }

      // Use server-side API for faster processing
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Background removal failed');
      }

      const resultBlob = await response.blob();
      const url = URL.createObjectURL(resultBlob);
      return url;
    } catch (err) {
      console.error('Background removal failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { removeBackground, isLoading, error };
}
