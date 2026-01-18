import { useState, useCallback, useRef, useEffect } from 'react';

const PYTHON_API_URL = 'http://localhost:8000/remove-bg';

export function useBackgroundRemover() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Progress simulation interval
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const startProgressSimulation = useCallback(() => {
    setProgress(0);
    let currentProgress = 0;
    
    // Simulate progress: fast at start, slows down as it approaches 90%
    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < 90) {
        // Progress faster at the beginning, slower near the end
        const increment = Math.max(0.5, (90 - currentProgress) / 20);
        currentProgress = Math.min(90, currentProgress + increment);
        setProgress(Math.round(currentProgress));
      }
    }, 100);
  }, []);

  const stopProgressSimulation = useCallback((success: boolean) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    // Jump to 100% on success, or stay where it was on error
    if (success) {
      setProgress(100);
      // Reset after a short delay
      setTimeout(() => setProgress(0), 500);
    } else {
      setProgress(0);
    }
  }, []);

  const removeBackground = useCallback(async (imageSrc: string | Blob | File) => {
    setIsLoading(true);
    setError(null);
    setProcessingTime(null);
    startProgressSimulation();
    
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
      
      stopProgressSimulation(true);
      return url;
    } catch (err) {
      console.error('Background removal failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      stopProgressSimulation(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [startProgressSimulation, stopProgressSimulation]);

  return { removeBackground, isLoading, error, processingTime, progress };
}
