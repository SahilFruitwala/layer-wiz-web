'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as fabric from 'fabric';
import { useBackgroundRemover } from '@/hooks/useBackgroundRemover';

interface EditorCanvasProps {
  file: File | null;
  onLoadingChange: (loading: boolean) => void;
}

export interface EditorCanvasRef {
  addText: () => void;
  download: () => void;
}

const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(({ file, onLoadingChange }, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { removeBackground, isLoading } = useBackgroundRemover();
  
  // Store image references for layer management
  const imageLayersRef = useRef<{
    bgImage: fabric.FabricImage | null;
    fgImage: fabric.FabricImage | null;
    originalWidth: number;
    originalHeight: number;
  }>({ bgImage: null, fgImage: null, originalWidth: 0, originalHeight: 0 });

  // Recalculate and apply scaling to fit container
  const fitToContainer = () => {
    const canvas = canvasInstance.current;
    const container = containerRef.current;
    const { bgImage, fgImage, originalWidth, originalHeight } = imageLayersRef.current;
    
    if (!canvas || !container || !bgImage || originalWidth === 0) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale to fit image within container (contain behavior)
    const scale = Math.min(containerWidth / originalWidth, containerHeight / originalHeight);
    
    // Set canvas to scaled image size
    const newWidth = Math.floor(originalWidth * scale);
    const newHeight = Math.floor(originalHeight * scale);
    
    canvas.setDimensions({ width: newWidth, height: newHeight });
    
    // Scale and position both layers
    bgImage.scale(scale);
    bgImage.set({ left: 0, top: 0 });
    bgImage.setCoords();
    
    if (fgImage) {
      fgImage.scale(scale);
      fgImage.set({ left: 0, top: 0 });
      fgImage.setCoords();
    }
    
    canvas.requestRenderAll();
  };

  useImperativeHandle(ref, () => ({
    addText: () => {
      const canvas = canvasInstance.current;
      if (!canvas) return;
      
      const fontSize = Math.max(40, Math.floor((canvas.width || 400) / 8));
      
      const text = new fabric.IText('Your Text Here', {
        left: (canvas.width || 400) / 2,
        top: (canvas.height || 300) / 2,
        originX: 'center',
        originY: 'center',
        fill: '#ffffff',
        fontSize: fontSize,
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontWeight: 'bold',
        shadow: new fabric.Shadow({ 
          color: 'rgba(0,0,0,0.6)', 
          blur: 15, 
          offsetX: 3, 
          offsetY: 3 
        })
      });
      
      canvas.add(text);
      canvas.setActiveObject(text);
      
      // Ensure foreground is always on top
      if (imageLayersRef.current.fgImage) {
        canvas.bringObjectToFront(imageLayersRef.current.fgImage);
      }
      
      canvas.requestRenderAll();
    },
    download: () => {
      const canvas = canvasInstance.current;
      if (!canvas) return;
      
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
      
      const link = document.createElement('a');
      link.download = 'layerwiz-composition.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }));

  // Report loading state
  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasEl.current || !containerRef.current) return;
    
    if (canvasInstance.current) {
      canvasInstance.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasEl.current, {
      backgroundColor: '#1a1a1a',
      preserveObjectStacking: true,
      selection: true
    });
    
    canvasInstance.current = canvas;
    
    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => fitToContainer());
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      canvasInstance.current = null;
    };
  }, []);

  // Process uploaded file
  useEffect(() => {
    if (!file || !canvasInstance.current) return;
    
    const processImage = async () => {
      const canvas = canvasInstance.current!;
      
      // Clear previous content
      canvas.clear();
      canvas.backgroundColor = '#1a1a1a';
      imageLayersRef.current = { bgImage: null, fgImage: null, originalWidth: 0, originalHeight: 0 };
      
      try {
        const imgUrl = URL.createObjectURL(file);
        
        // Load background image
        const bgImage = await fabric.FabricImage.fromURL(imgUrl);
        
        const originalWidth = bgImage.width || 800;
        const originalHeight = bgImage.height || 600;
        
        bgImage.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true
        });
        
        imageLayersRef.current.bgImage = bgImage;
        imageLayersRef.current.originalWidth = originalWidth;
        imageLayersRef.current.originalHeight = originalHeight;
        
        canvas.add(bgImage);
        
        // Initial fit
        fitToContainer();
        
        // Process background removal
        onLoadingChange(true);
        const cutoutUrl = await removeBackground(file);
        onLoadingChange(false);
        
        // Load foreground (cutout) image
        const fgImage = await fabric.FabricImage.fromURL(cutoutUrl);
        
        fgImage.set({
          selectable: false,
          evented: false, // Critical: allows clicking through to text
          lockMovementX: true,
          lockMovementY: true
        });
        
        imageLayersRef.current.fgImage = fgImage;
        
        canvas.add(fgImage);
        canvas.bringObjectToFront(fgImage);
        
        // Re-fit with both layers
        fitToContainer();
        
        // Cleanup blob URL
        URL.revokeObjectURL(imgUrl);
        
      } catch (err) {
        console.error('Error processing image:', err);
        onLoadingChange(false);
      }
    };

    processImage();
  }, [file, removeBackground, onLoadingChange]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center"
    >
      <canvas ref={canvasEl} />
    </div>
  );
});

EditorCanvas.displayName = 'EditorCanvas';

export default EditorCanvas;
