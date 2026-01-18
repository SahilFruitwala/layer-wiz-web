import { useState, useCallback } from 'react';

const PYTHON_API_URL = 'http://localhost:8000/remove-bg';

export function useBackgroundRemover() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const removeBackground = useCallback(async (imageSrc: string | Blob | File) => {
    setIsLoading(true);
    setError(null);
    setProcessingTime(null);
    
    try {
      // Convert to File/Blob for API upload
      let file: File | Blob;
      
      if (typeof imageSrc === 'string') {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        file = new File([blob], 'image.png', { type: blob.type });
      } else {
        file = imageSrc;
      }

      // Use Python FastAPI with BiRefNet (SOTA 2024)
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(PYTHON_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Background removal failed');
      }

      // Get timing from header
      const timing = response.headers.get('X-Processing-Time-Ms');
      if (timing) {
        setProcessingTime(parseInt(timing, 10));
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

  return { removeBackground, isLoading, error, processingTime };
}
