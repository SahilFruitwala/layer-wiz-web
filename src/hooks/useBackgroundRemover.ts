
import { useState, useCallback } from 'react';

export function useBackgroundRemover() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeBackground = useCallback(async (imageSrc: string | Blob | File) => {
    setIsLoading(true);
    setError(null);
    try {
      // Lazy load the library
      const { removeBackground } = await import('@imgly/background-removal');
      
      const blob = await removeBackground(imageSrc, {
        progress: (key, current, total) => {
          // Optional: handle progress
          const progress = current / total;
          console.log(`Downloading ${key}: ${Math.round(progress * 100)}%`);
        },
      });

      const url = URL.createObjectURL(blob);
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
