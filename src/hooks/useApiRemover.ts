import { useState, useCallback } from 'react';

export type BackendType = 'node' | 'python';

export interface RemovalResult {
  url: string;
  timing: number;
  backend: BackendType;
}

export function useApiRemover() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RemovalResult | null>(null);

  const removeBackground = useCallback(async (
    imageSrc: string | Blob | File,
    backend: BackendType = 'node'
  ): Promise<RemovalResult> => {
    setIsLoading(true);
    setError(null);

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

      // Prepare form data
      const formData = new FormData();
      formData.append('image', file);

      // Select API endpoint based on backend
      const apiUrl = backend === 'python'
        ? 'http://localhost:8000/remove-bg'
        : '/api/remove-bg';

      const startTime = performance.now();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Background removal failed');
      }

      // Get timing from header or calculate fallback
      const serverTiming = response.headers.get('X-Processing-Time-Ms');
      const timing = serverTiming 
        ? parseInt(serverTiming, 10) 
        : Math.round(performance.now() - startTime);

      const resultBlob = await response.blob();
      const url = URL.createObjectURL(resultBlob);

      const result: RemovalResult = { url, timing, backend };
      setLastResult(result);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    removeBackground, 
    isLoading, 
    error, 
    lastResult 
  };
}
