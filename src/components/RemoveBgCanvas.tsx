'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { useBackgroundRemover } from '@/hooks/useBackgroundRemover';

interface RemoveBgCanvasProps {
  file: File | null;
  onLoadingChange: (loading: boolean) => void;
}

export interface RemoveBgCanvasRef {
  download: () => void;
}

const RemoveBgCanvas = forwardRef<RemoveBgCanvasRef, RemoveBgCanvasProps>(({ file, onLoadingChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { removeBackground, isLoading } = useBackgroundRemover();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    download: () => {
      if (!resultUrl) return;
      
      const link = document.createElement('a');
      link.download = 'background-removed.png';
      link.href = resultUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }));

  // Report loading state
  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  // Process uploaded file
  useEffect(() => {
    if (!file) return;
    
    // Cleanup previous URLs
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    
    const processImage = async () => {
      try {
        const imgUrl = URL.createObjectURL(file);
        setOriginalUrl(imgUrl);
        setResultUrl(null);
        
        onLoadingChange(true);
        const cutoutUrl = await removeBackground(file);
        onLoadingChange(false);
        
        setResultUrl(cutoutUrl);
      } catch (err) {
        console.error('Error processing image:', err);
        onLoadingChange(false);
      }
    };

    processImage();
    
    // Cleanup on unmount
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center p-4"
    >
      {resultUrl ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Checkerboard background to show transparency */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #333 25%, transparent 25%),
                linear-gradient(-45deg, #333 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #333 75%),
                linear-gradient(-45deg, transparent 75%, #333 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
          <img 
            src={resultUrl} 
            alt="Background removed" 
            className="max-w-full max-h-full object-contain relative z-10"
          />
        </div>
      ) : originalUrl ? (
        <img 
          src={originalUrl} 
          alt="Original" 
          className="max-w-full max-h-full object-contain opacity-50"
        />
      ) : (
        <div className="text-neutral-500 text-center">
          <p>Upload an image to remove its background</p>
        </div>
      )}
    </div>
  );
});

RemoveBgCanvas.displayName = 'RemoveBgCanvas';

export default RemoveBgCanvas;
