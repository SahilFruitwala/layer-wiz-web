'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useBackgroundRemover } from '@/hooks/useBackgroundRemover';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface RemoveBgCanvasProps {
  file: File | null;
  onLoadingChange: (loading: boolean) => void;
  onProgressChange?: (progress: number) => void;
}

export interface RemoveBgCanvasRef {
  download: () => void;
  setEraserMode: (enabled: boolean) => void;
  setBrushSize: (size: number) => void;
  undo: () => void;
  reset: () => void;
}

const RemoveBgCanvas = forwardRef<RemoveBgCanvasRef, RemoveBgCanvasProps>(({ file, onLoadingChange, onProgressChange }, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { removeBackground, isLoading, progress } = useBackgroundRemover();
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [brushSize, setBrushSizeState] = useState(30);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isPanningRef = useRef(false);
  
  // Store stroke history for undo
  const strokeHistoryRef = useRef<fabric.FabricObject[]>([]);
  // Store the original image element for high-res download
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  // Store original dimensions
  const originalDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  // Store current scale for download
  const currentScaleRef = useRef<number>(1);
  // Store last pan position
  const lastPanPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Configure eraser brush
  const configureEraserBrush = useCallback((canvas: fabric.Canvas) => {
    const brush = new fabric.PencilBrush(canvas);
    brush.width = brushSize;
    brush.color = 'rgba(0,0,0,1)';
    canvas.freeDrawingBrush = brush;
  }, [brushSize]);

  // Zoom functions
  const handleZoom = useCallback((delta: number, point?: { x: number; y: number }) => {
    const canvas = canvasInstance.current;
    if (!canvas) return;
    
    let newZoom = zoomLevel + delta;
    newZoom = Math.min(Math.max(0.5, newZoom), 5); // Limit zoom between 0.5x and 5x
    
    if (point) {
      canvas.zoomToPoint(new fabric.Point(point.x, point.y), newZoom);
    } else {
      const center = canvas.getVpCenter();
      canvas.zoomToPoint(center, newZoom);
    }
    
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  const resetZoom = useCallback(() => {
    const canvas = canvasInstance.current;
    if (!canvas) return;
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomLevel(1);
  }, []);

  useImperativeHandle(ref, () => ({
    download: () => {
      const canvas = canvasInstance.current;
      const originalImg = originalImageRef.current;
      if (!canvas || !originalImg) return;
      
      const { width, height } = originalDimensionsRef.current;
      const scale = currentScaleRef.current;
      
      // Create a temporary canvas at original resolution
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d')!;
      
      // Draw the original image at full resolution
      ctx.drawImage(originalImg, 0, 0, width, height);
      
      // Apply eraser strokes using destination-out, scaled up to original resolution
      ctx.globalCompositeOperation = 'destination-out';
      
      strokeHistoryRef.current.forEach(stroke => {
        if (stroke instanceof fabric.Path && stroke.path) {
          ctx.save();
          
          // Scale the stroke from canvas coordinates to original coordinates
          ctx.scale(1 / scale, 1 / scale);
          
          // Path commands are absolute in canvas coordinates, no need to translate
          // as we are manually drawing the path commands
          
          
          ctx.beginPath();
          ctx.lineWidth = (stroke.strokeWidth || brushSize);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          stroke.path.forEach((cmd: unknown) => {
            const segment = cmd as (string | number)[];
            if (segment[0] === 'M') {
              ctx.moveTo(segment[1] as number, segment[2] as number);
            } else if (segment[0] === 'Q') {
              ctx.quadraticCurveTo(
                segment[1] as number,
                segment[2] as number,
                segment[3] as number,
                segment[4] as number
              );
            } else if (segment[0] === 'L') {
              ctx.lineTo(segment[1] as number, segment[2] as number);
            }
          });
          
          ctx.stroke();
          ctx.restore();
        }
      });
      
      // Download
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

  // Report progress
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [progress, onProgressChange]);

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

    // Handle mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      const zoomDelta = delta > 0 ? -0.1 : 0.1;
      const pointer = canvas.getScenePoint(opt.e);
      
      let newZoom = canvas.getZoom() + zoomDelta;
      newZoom = Math.min(Math.max(0.5, newZoom), 5);
      
      canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), newZoom);
      setZoomLevel(newZoom);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Handle panning with middle mouse button or alt+left click
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.button === 1 || evt.altKey) {
        isPanningRef.current = true;
        canvas.isDrawingMode = false;
        lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
        canvas.setCursor('grab');
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (!isPanningRef.current) return;
      
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;
      
      vpt[4] += evt.clientX - lastPanPosRef.current.x;
      vpt[5] += evt.clientY - lastPanPosRef.current.y;
      
      lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
      isPanningRef.current = false;
      canvas.setCursor('default');
    });

    return () => {
      canvas.dispose();
      canvasInstance.current = null;
    };
  }, []); // Empty deps - only run once

  // Process uploaded file
  useEffect(() => {
    if (!file || !canvasInstance.current || !containerRef.current) return;
    
    const canvas = canvasInstance.current;
    const container = containerRef.current;
    let cancelled = false;
    
    // Reset state
    strokeHistoryRef.current = [];
    originalImageRef.current = null;
    setZoomLevel(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    // Clear canvas
    canvas.clear();
    canvas.backgroundColor = 'transparent';
    
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    
    const processImage = async () => {
      try {
        onLoadingChange(true);
        const cutoutUrl = await removeBackground(file);
        
        if (cancelled) return;
        
        onLoadingChange(false);
        setResultUrl(cutoutUrl);
        
        // Load the original image element for high-res download
        const imgElement = new Image();
        imgElement.crossOrigin = 'anonymous';
        imgElement.onload = () => {
          if (cancelled || !canvasInstance.current) return;
          
          originalImageRef.current = imgElement;
          originalDimensionsRef.current = {
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight
          };
          
          // Calculate scale to fit container
          const padding = 32;
          const containerWidth = container.clientWidth - padding;
          const containerHeight = container.clientHeight - padding;
          
          const scale = Math.min(
            containerWidth / imgElement.naturalWidth,
            containerHeight / imgElement.naturalHeight,
            1 // Don't scale up
          );
          
          currentScaleRef.current = scale;
          
          // Set canvas to the scaled size
          const canvasWidth = Math.floor(imgElement.naturalWidth * scale);
          const canvasHeight = Math.floor(imgElement.naturalHeight * scale);
          
          const currentCanvas = canvasInstance.current;
          if (!currentCanvas) return;
          
          currentCanvas.setDimensions({ width: canvasWidth, height: canvasHeight });
          
          // Create fabric image at native scale (1:1 with canvas)
          fabric.FabricImage.fromURL(cutoutUrl).then((fabricImg) => {
            if (cancelled || !canvasInstance.current) return;
            
            fabricImg.set({
              scaleX: scale,
              scaleY: scale,
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
              originX: 'left',
              originY: 'top',
              left: 0,
              top: 0
            });
            
            canvasInstance.current.add(fabricImg);
            canvasInstance.current.sendObjectToBack(fabricImg);
            canvasInstance.current.requestRenderAll();
          });
        };
        imgElement.src = cutoutUrl;
        
      } catch (err) {
        if (!cancelled) {
          console.error('Error processing image:', err);
          onLoadingChange(false);
        }
      }
    };

    processImage();
    
    return () => {
      cancelled = true;
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center p-4 relative overflow-hidden"
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
      
      {/* Canvas */}
      <canvas 
        ref={canvasEl}
        className="relative z-10"
      />
      
      {/* Zoom Controls */}
      {resultUrl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10">
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-white font-mono min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.25)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={resetZoom}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Zoom hint */}
      {resultUrl && zoomLevel === 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-xs text-neutral-400 bg-black/50 px-3 py-1.5 rounded-full">
          Scroll to zoom • Alt+drag to pan
        </div>
      )}
    </div>
  );
});

RemoveBgCanvas.displayName = 'RemoveBgCanvas';

export default RemoveBgCanvas;
