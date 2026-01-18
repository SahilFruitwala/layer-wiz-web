'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useApiRemover, BackendType, RemovalResult } from '@/hooks/useApiRemover';

interface RemoveBgCanvasProps {
  file: File | null;
  onLoadingChange: (loading: boolean) => void;
  backend?: BackendType;
  onResultChange?: (result: RemovalResult | null) => void;
}

export interface RemoveBgCanvasRef {
  download: () => void;
  setEraserMode: (enabled: boolean) => void;
  setBrushSize: (size: number) => void;
  undo: () => void;
  reset: () => void;
}

const RemoveBgCanvas = forwardRef<RemoveBgCanvasRef, RemoveBgCanvasProps>(({ file, onLoadingChange, backend = 'node', onResultChange }, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { removeBackground, isLoading } = useApiRemover();
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [brushSize, setBrushSizeState] = useState(30);
  
  // Store stroke history for undo
  const strokeHistoryRef = useRef<fabric.FabricObject[]>([]);
  // Store the original image for reset
  const originalImageRef = useRef<fabric.FabricImage | null>(null);
  // Store original dimensions
  const originalDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Recalculate and apply scaling to fit container
  const fitToContainer = useCallback(() => {
    const canvas = canvasInstance.current;
    const container = containerRef.current;
    const { width: originalWidth, height: originalHeight } = originalDimensionsRef.current;
    
    if (!canvas || !container || originalWidth === 0) return;

    const padding = 16;
    const containerWidth = container.clientWidth - (padding * 2);
    const containerHeight = container.clientHeight - (padding * 2);
    
    const scale = Math.min(containerWidth / originalWidth, containerHeight / originalHeight);
    
    const newWidth = Math.floor(originalWidth * scale);
    const newHeight = Math.floor(originalHeight * scale);
    
    canvas.setDimensions({ width: newWidth, height: newHeight });
    
    // Scale all objects
    canvas.getObjects().forEach((obj) => {
      if (obj === originalImageRef.current) {
        obj.set({ 
          scaleX: scale, 
          scaleY: scale, 
          left: 0, 
          top: 0,
          originX: 'left',
          originY: 'top'
        });
        obj.setCoords();
      }
    });
    
    canvas.requestRenderAll();
  }, []);

  // Configure eraser brush
  const configureEraserBrush = useCallback((canvas: fabric.Canvas) => {
    const brush = new fabric.PencilBrush(canvas);
    brush.width = brushSize;
    brush.color = 'rgba(0,0,0,1)';
    canvas.freeDrawingBrush = brush;
  }, [brushSize]);

  useImperativeHandle(ref, () => ({
    download: () => {
      const canvas = canvasInstance.current;
      if (!canvas) return;
      
      // Create a temporary canvas at original resolution
      const { width, height } = originalDimensionsRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d')!;
      
      // Draw the original image
      if (originalImageRef.current) {
        const imgElement = originalImageRef.current.getElement() as HTMLImageElement;
        ctx.drawImage(imgElement, 0, 0, width, height);
      }
      
      // Get current canvas scale
      const currentScale = canvas.width! / width;
      
      // Apply eraser strokes using destination-out
      ctx.globalCompositeOperation = 'destination-out';
      strokeHistoryRef.current.forEach(stroke => {
        if (stroke instanceof fabric.Path) {
          // Scale path back to original size
          const scaledPath = stroke.path?.map(segment => {
            if (Array.isArray(segment)) {
              return segment.map((val, idx) => 
                idx === 0 ? val : (typeof val === 'number' ? val / currentScale : val)
              );
            }
            return segment;
          });
          
          const originalLeft = (stroke.left || 0) / currentScale;
          const originalTop = (stroke.top || 0) / currentScale;
          const originalWidth = (stroke.width || 0) / currentScale;
          const originalHeight = (stroke.height || 0) / currentScale;
          
          ctx.save();
          ctx.translate(originalLeft + originalWidth / 2, originalTop + originalHeight / 2);
          ctx.beginPath();
          
          scaledPath?.forEach((cmd: unknown) => {
            const segment = cmd as (string | number)[];
            if (segment[0] === 'M') {
              ctx.moveTo(
                ((segment[1] as number) - originalWidth / 2), 
                ((segment[2] as number) - originalHeight / 2)
              );
            } else if (segment[0] === 'Q') {
              ctx.quadraticCurveTo(
                ((segment[1] as number) - originalWidth / 2),
                ((segment[2] as number) - originalHeight / 2),
                ((segment[3] as number) - originalWidth / 2),
                ((segment[4] as number) - originalHeight / 2)
              );
            } else if (segment[0] === 'L') {
              ctx.lineTo(
                ((segment[1] as number) - originalWidth / 2),
                ((segment[2] as number) - originalHeight / 2)
              );
            }
          });
          
          ctx.lineWidth = (stroke.strokeWidth || brushSize) / currentScale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.restore();
        }
      });
      
      const dataURL = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'background-removed.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    setEraserMode: (enabled: boolean) => {
      const canvas = canvasInstance.current;
      if (!canvas) return;
      
      canvas.isDrawingMode = enabled;
      if (enabled) {
        configureEraserBrush(canvas);
      }
    },
    
    setBrushSize: (size: number) => {
      setBrushSizeState(size);
      const canvas = canvasInstance.current;
      if (canvas?.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = size;
      }
    },
    
    undo: () => {
      const canvas = canvasInstance.current;
      if (!canvas || strokeHistoryRef.current.length === 0) return;
      
      const lastStroke = strokeHistoryRef.current.pop();
      if (lastStroke) {
        canvas.remove(lastStroke);
        canvas.requestRenderAll();
      }
    },
    
    reset: () => {
      const canvas = canvasInstance.current;
      if (!canvas) return;
      
      // Remove all strokes
      strokeHistoryRef.current.forEach(stroke => {
        canvas.remove(stroke);
      });
      strokeHistoryRef.current = [];
      canvas.requestRenderAll();
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
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      selection: false
    });
    
    canvasInstance.current = canvas;
    
    // Handle path creation (eraser strokes)
    canvas.on('path:created', (e) => {
      const path = e.path;
      if (path) {
        // Apply eraser effect visually
        path.set({
          globalCompositeOperation: 'destination-out',
          selectable: false,
          evented: false
        });
        strokeHistoryRef.current.push(path);
        canvas.requestRenderAll();
      }
    });
    
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
  }, [fitToContainer]);

  // Process uploaded file
  useEffect(() => {
    if (!file || !canvasInstance.current) return;
    
    // Reset state
    strokeHistoryRef.current = [];
    originalImageRef.current = null;
    
    const processImage = async () => {
      const canvas = canvasInstance.current!;
      
      // Clear previous content
      canvas.clear();
      canvas.backgroundColor = 'transparent';
      
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
      
      try {
        onLoadingChange(true);
        const result = await removeBackground(file, backend);
        onLoadingChange(false);
        
        setResultUrl(result.url);
        if (onResultChange) {
          onResultChange(result);
        }
        
        // Load the cutout image into fabric
        const img = await fabric.FabricImage.fromURL(result.url);
        
        originalDimensionsRef.current = {
          width: img.width || 800,
          height: img.height || 600
        };
        
        img.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          originX: 'left',
          originY: 'top',
          left: 0,
          top: 0
        });
        
        originalImageRef.current = img;
        canvas.add(img);
        
        // Fit to container
        fitToContainer();
        
      } catch (err) {
        console.error('Error processing image:', err);
        onLoadingChange(false);
      }
    };

    processImage();
    
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center p-4 relative"
    >
      {/* Checkerboard background */}
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
      <canvas ref={canvasEl} className="relative z-10" />
    </div>
  );
});

RemoveBgCanvas.displayName = 'RemoveBgCanvas';

export default RemoveBgCanvas;
