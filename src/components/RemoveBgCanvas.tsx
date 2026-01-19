'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useBackgroundRemover } from '@/hooks/useBackgroundRemover';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface RemoveBgCanvasProps {
  file: File | null;
  onLoadingChange: (loading: boolean) => void;
  onProgressChange?: (progress: number) => void;
  isPrepMode?: boolean;
  onSelectionChange?: (object: fabric.Object | null) => void;
}

export interface TextOptions {
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: string;
}

export interface RemoveBgCanvasRef {
  download: () => Promise<void>;
  setEraserMode: (enabled: boolean) => void;
  setBrushSize: (size: number) => void;
  undo: () => void;
  reset: () => void;
  setBackground: (type: string, value: string) => void;
  addText: () => void;
  updateText: (options: TextOptions) => void;
  triggerRemoveBackground: () => Promise<void>;
}

const RemoveBgCanvas = forwardRef<RemoveBgCanvasRef, RemoveBgCanvasProps>(({ 
  file, 
  onLoadingChange, 
  onProgressChange,
  isPrepMode = false,
  onSelectionChange
}, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const bgCanvasEl = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null); // Foreground (Subject + Eraser)
  const bgCanvasInstance = useRef<fabric.Canvas | null>(null); // Background (Color/Img + Text)
  const containerRef = useRef<HTMLDivElement>(null);
  const { removeBackground, isLoading, progress } = useBackgroundRemover();
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [brushSize, setBrushSizeState] = useState(30);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const isEraserModeRef = useRef(false);
  
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
  // Configure eraser brush
  const configureEraserBrush = useCallback((canvas: fabric.Canvas) => {
    const brush = new fabric.PencilBrush(canvas);
    brush.width = brushSize;
    brush.color = 'rgba(0,0,0,1)';
    canvas.freeDrawingBrush = brush;
  }, [brushSize]);

  // Sync Background Canvas Transform
  const syncBackgroundCanvas = useCallback(() => {
    const fg = canvasInstance.current;
    const bg = bgCanvasInstance.current;
    if (!fg || !bg) return;
    
    // Check if viewportTransform is available
    if (fg.viewportTransform) {
        bg.setViewportTransform([...fg.viewportTransform]);
    }
    bg.requestRenderAll();
  }, []);

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
    // Sync happens in effect or manually
    // We call sync immediately
    syncBackgroundCanvas();
  }, [zoomLevel, syncBackgroundCanvas]);

  const resetZoom = useCallback(() => {
    const canvas = canvasInstance.current;
    if (!canvas) return;
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomLevel(1);
    syncBackgroundCanvas();
  }, [syncBackgroundCanvas]);

  useImperativeHandle(ref, () => ({



    download: async () => {
      const canvas = canvasInstance.current;
      const bgCanvas = bgCanvasInstance.current;
      const originalImg = originalImageRef.current;
      if (!canvas || !bgCanvas || !originalImg || !resultUrl) return;
      
      const { width, height } = originalDimensionsRef.current;
      const scale = currentScaleRef.current;
      
      // 1. Prepare Background Layer
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const finalCtx = finalCanvas.getContext('2d')!;

      // Render Background Objects Scaling Up
      const multiplier = 1 / scale;
      
      const bgDataURL = bgCanvas.toDataURL({
        format: 'png',
        multiplier: multiplier,
        width: canvas.width!, 
        height: canvas.height!
      });

      const bgImg = new Image();
      bgImg.src = bgDataURL;
      await new Promise<void>(resolve => { bgImg.onload = () => resolve(); });
      
      finalCtx.drawImage(bgImg, 0, 0, width, height);

      // 2. Prepare Foreground (Subject with transparency)
      const subjectCanvas = document.createElement('canvas');
      subjectCanvas.width = width;
      subjectCanvas.height = height;
      const subjectCtx = subjectCanvas.getContext('2d')!;
      
      // Draw original subject
      subjectCtx.drawImage(originalImg, 0, 0, width, height);
      
      // Apply Eraser
      subjectCtx.globalCompositeOperation = 'destination-out';
      
      strokeHistoryRef.current.forEach(stroke => {
        if (stroke instanceof fabric.Path && stroke.path) {
          subjectCtx.save();
          
          subjectCtx.scale(1 / scale, 1 / scale);
          
          subjectCtx.beginPath();
          subjectCtx.lineWidth = (stroke.strokeWidth || brushSize);
          subjectCtx.lineCap = 'round';
          subjectCtx.lineJoin = 'round';
          
          stroke.path.forEach((cmd: any) => {
             const segment = cmd as (string | number)[];
             if (segment[0] === 'M') subjectCtx.moveTo(segment[1] as number, segment[2] as number);
             else if (segment[0] === 'Q') subjectCtx.quadraticCurveTo(segment[1] as number, segment[2] as number, segment[3] as number, segment[4] as number);
             else if (segment[0] === 'L') subjectCtx.lineTo(segment[1] as number, segment[2] as number);
          });
          
          subjectCtx.stroke();
          subjectCtx.restore();
        }
      });

      // Draw Subject onto Final
      finalCtx.globalCompositeOperation = 'source-over';
      finalCtx.drawImage(subjectCanvas, 0, 0);

      const link = document.createElement('a');
      link.download = 'layer-wiz-export.png';
      link.href = finalCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    setEraserMode: (enabled: boolean) => {
      setIsEraserMode(enabled);
      isEraserModeRef.current = enabled;
      const canvas = canvasInstance.current;
      if (!canvas) return;
      canvas.isDrawingMode = enabled;
      if (enabled) configureEraserBrush(canvas);
    },
    
    setBrushSize: (size: number) => {
      setBrushSizeState(size);
      const canvas = canvasInstance.current;
      if (canvas?.freeDrawingBrush) canvas.freeDrawingBrush.width = size;
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
      strokeHistoryRef.current.forEach(stroke => canvas.remove(stroke));
      strokeHistoryRef.current = [];
      canvas.requestRenderAll();
    },

    setBackground: (type: string, value: string) => {
       const bgCanvas = bgCanvasInstance.current;
       if (!bgCanvas) return;

       // Clear existing background
       // In Fabric v6, backgroundColor handles color strings. 
       // For Images/Gradients as "Background", we can use set('backgroundImage', ...)
       
       // Clear objects that were used as background
       const objects = bgCanvas.getObjects();
       const existingBg = objects.find((o: any) => o.isBackground);
       if (existingBg) bgCanvas.remove(existingBg);
       
       bgCanvas.backgroundColor = 'transparent';

       if (type === 'color') {
          // Simplest: use fabric backgroundColor property
          // This ensures it behaves like a real background
          bgCanvas.backgroundColor = value;
          bgCanvas.requestRenderAll();
       } else if (type === 'gradient') {
           // Parse CSS linear-gradient to Fabric Gradient or Canvas Gradient
           // Value format example: "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)"
           
           const canvasWidth = bgCanvas.width || 800;
           const canvasHeight = bgCanvas.height || 800;
           
           // We will create a fabric.Rect as the background
           const rect = new fabric.Rect({
               width: canvasWidth, 
               height: canvasHeight,
               left: 0, 
               top: 0,
               selectable: false, 
               evented: false,
               originX: 'left',
               originY: 'top'
           });
// @ts-expect-error - Custom property
           (rect as fabric.Object).isBackground = true;

           // Helper parsing logic
           let coords = { x1: 0, y1: 0, x2: 0, y2: 0 };
           const isDegree = value.includes('deg');
           const isToRight = value.includes('to right');
           const isToTop = value.includes('to top');
           
           if (isToRight) {
               coords = { x1: 0, y1: 0, x2: canvasWidth, y2: 0 };
           } else if (isToTop) {
               coords = { x1: 0, y1: canvasHeight, x2: 0, y2: 0 };
           } else if (isDegree) {
               // Approximate diagonal for 120deg/135deg
               // 135deg is top-left to bottom-right roughly in visual feel for CSS? 
               // Actually 0deg is Top, 90deg is Right, 180deg is Bottom.
               // 120deg ~ Bottom Right.
               coords = { x1: 0, y1: 0, x2: canvasWidth, y2: canvasHeight };
           }

           // Extract colors - simple regex for hex codes
           const colorMatches = value.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g) || ['#000000', '#ffffff'];
           const colorStops = colorMatches.map((color, index) => ({
               offset: index / (colorMatches.length - 1),
               color: color
           }));

           // If manual stops provided in string (e.g. 0%, 100%), ideally parse them.
           // But for our preset list, they are mostly 0% and 100%.
           
           const gradient = new fabric.Gradient({
               type: 'linear',
               coords: coords,
               colorStops: colorStops
           });

           rect.set('fill', gradient);
           bgCanvas.add(rect);
           bgCanvas.sendObjectToBack(rect);
           bgCanvas.requestRenderAll();

        } else if (type === 'image') {
           fabric.FabricImage.fromURL(value).then(img => {
              if (!bgCanvasInstance.current) return;
              const bgCanvas = bgCanvasInstance.current;
              // Cover logic
              const canvasAspect = bgCanvas.width! / bgCanvas.height!;
             const imgAspect = img.width! / img.height!;
             let scaleFactor;
             if (canvasAspect > imgAspect) {
                scaleFactor = bgCanvas.width! / img.width!;
             } else {
                scaleFactor = bgCanvas.height! / img.height!;
             }
             img.scale(scaleFactor);
             img.set({
                 originX: 'center', originY: 'center',
                 left: bgCanvas.width! / 2, top: bgCanvas.height! / 2,
                 selectable: false, evented: false
             });
             // @ts-expect-error - Custom property
             (img as fabric.Object).isBackground = true;
             bgCanvas.add(img);
             bgCanvas.sendObjectToBack(img);
             bgCanvas.requestRenderAll();
          });
       } else if (type === 'transparent') {
           bgCanvas.backgroundColor = 'transparent';
           bgCanvas.requestRenderAll();
       }
    },

    addText: () => {
         const bgCanvas = bgCanvasInstance.current;
         if (!bgCanvas) return;
         const text = new fabric.IText('Double click to edit', {
             left: bgCanvas.width! / 2,
             top: bgCanvas.height! / 2,
             originX: 'center',
             originY: 'center',
             fontFamily: 'Inter',
             fill: '#ffffff',
             fontSize: 60,
             fontWeight: 'bold',
             shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 })
         });
         bgCanvas.add(text);
         bgCanvas.setActiveObject(text);
         bgCanvas.requestRenderAll();
    },

    updateText: (options: TextOptions) => {
        const bgCanvas = bgCanvasInstance.current;
        if (!bgCanvas) return;
        const activeObject = bgCanvas.getActiveObject();
        if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
            activeObject.set(options);
            bgCanvas.requestRenderAll();
        }
    },

    triggerRemoveBackground: async () => {
        await processImage(true);
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
    if (!canvasEl.current || !bgCanvasEl.current || !containerRef.current) return;
    
    if (canvasInstance.current) canvasInstance.current.dispose();
    if (bgCanvasInstance.current) bgCanvasInstance.current.dispose();

    // 1. Bg Canvas
    const bgCanvas = new fabric.Canvas(bgCanvasEl.current, {
        backgroundColor: 'transparent',
        selection: true 
    });
    bgCanvasInstance.current = bgCanvas;

    // Handle Selection Events
    const handleSelection = () => {
        const active = bgCanvas.getActiveObject();
        if (onSelectionChange) {
            onSelectionChange(active || null);
        }
    };

    bgCanvas.on('selection:created', handleSelection);
    bgCanvas.on('selection:updated', handleSelection);
    bgCanvas.on('selection:cleared', handleSelection);

    // 2. Fg Canvas
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
         // Normal Eraser Stroke (Masking)
         path.set({
            globalCompositeOperation: 'destination-out',
            selectable: false,
            evented: false
         });
         strokeHistoryRef.current.push(path);
         canvas.requestRenderAll();
      }
    });



    // Helper to bind events
    const bindEvents = (source: fabric.Canvas, target: fabric.Canvas) => {
         // Handle mouse wheel zoom
        source.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            const zoomDelta = delta > 0 ? -0.1 : 0.1;
            const pointer = source.getScenePoint(opt.e);
            
            let newZoom = source.getZoom() + zoomDelta;
            newZoom = Math.min(Math.max(0.5, newZoom), 5);
            
            source.zoomToPoint(new fabric.Point(pointer.x, pointer.y), newZoom);
            // Sync target
            target.zoomToPoint(new fabric.Point(pointer.x, pointer.y), newZoom);
            
            setZoomLevel(newZoom);
            
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Handle panning
        source.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent;
            if (evt.button === 1 || evt.altKey) {
                isPanningRef.current = true;
                source.isDrawingMode = false;
                lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
                source.setCursor('grab');
            }
        });

        source.on('mouse:move', (opt) => {
            if (!isPanningRef.current) return;
            
            const evt = opt.e as MouseEvent;
            const vpt = source.viewportTransform;
            if (!vpt) return;
            
            vpt[4] += evt.clientX - lastPanPosRef.current.x;
            vpt[5] += evt.clientY - lastPanPosRef.current.y;
            
            // Sync target vpt
            if (target.viewportTransform) {
                target.viewportTransform[4] = vpt[4];
                target.viewportTransform[5] = vpt[5];
                target.requestRenderAll();
            }

            lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
            source.requestRenderAll();
        });

        source.on('mouse:up', () => {
            isPanningRef.current = false;
            source.setCursor('default');
            // If we turned off drawing mode for panning, restore it if needed
            // But actually we only pan on active canvas.
            // If erasing, we might need to restore isDrawingMode?
            // Simple check:
            if (source === canvasInstance.current && isEraserModeRef.current) {
                 source.isDrawingMode = true; 
            }
        });
    };

    // Bind events to both
    bindEvents(canvas, bgCanvas);
    bindEvents(bgCanvas, canvas);

    return () => {
      canvas.dispose();
      bgCanvas.dispose();
      canvasInstance.current = null;
      bgCanvasInstance.current = null;
    };
  }, [syncBackgroundCanvas]);


  // Handle Resize/Init of BG Canvas dimensions
  useEffect(() => {
       if (currentScaleRef.current && bgCanvasInstance.current && canvasInstance.current) {
           const w = canvasInstance.current.width!;
           const h = canvasInstance.current.height!;
           bgCanvasInstance.current.setDimensions({ width: w, height: h });
       }
  }, [resultUrl]);

  const processImage = async (forceRemoveBg = false, isCancelled?: () => boolean) => {
    if (!file || !canvasInstance.current || !bgCanvasInstance.current || !containerRef.current) return;
    
    try {
      onLoadingChange(true);
      
      let imageUrl: string;
      const shouldRemove = forceRemoveBg || !isPrepMode;
      
      if (shouldRemove) {
        // If we am in prep mode and resultUrl is already set (maybe via Magic Eraser),
        // we should use THAT as the source for background removal.
        let sourceFile: File | string = file;
        
        if (resultUrl && resultUrl.startsWith('data:')) {
            sourceFile = resultUrl; 
        } else if (resultUrl && resultUrl.startsWith('http')) {
            sourceFile = resultUrl;
        }

        imageUrl = await removeBackground(sourceFile as any);
      } else {
        // Just show the original
        imageUrl = URL.createObjectURL(file);
      }
      
      if (isCancelled?.()) return;
      onLoadingChange(false);
      
      // Revoke old URL if it was a local blob
      if (resultUrl && resultUrl.startsWith('blob:')) {
          URL.revokeObjectURL(resultUrl);
      }
      
      setResultUrl(imageUrl);
      
      const imgElement = new Image();
      imgElement.crossOrigin = 'anonymous';
      imgElement.onload = () => {
        if (isCancelled?.() || !canvasInstance.current || !bgCanvasInstance.current) return;
        
        const canvas = canvasInstance.current;
        const bgCanvas = bgCanvasInstance.current;
        const container = containerRef.current;
        if (!container) return;

        originalImageRef.current = imgElement;
        originalDimensionsRef.current = {
          width: imgElement.naturalWidth,
          height: imgElement.naturalHeight
        };
        
        // Calculate scale
        const padding = 32;
        const containerWidth = container.clientWidth - padding;
        const containerHeight = container.clientHeight - padding;
        
        const scale = Math.min(
          containerWidth / imgElement.naturalWidth,
          containerHeight / imgElement.naturalHeight,
          1 
        );
        
        currentScaleRef.current = scale;
        
        // Set canvas size
        const canvasWidth = Math.floor(imgElement.naturalWidth * scale);
        const canvasHeight = Math.floor(imgElement.naturalHeight * scale);
        
        canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
        bgCanvas.setDimensions({ width: canvasWidth, height: canvasHeight });
        
        canvas.clear();
        bgCanvas.clear();

        // Create fabric image
        fabric.FabricImage.fromURL(imageUrl).then((fabricImg) => {
          if (isCancelled?.() || !canvasInstance.current) return;
          
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
          
          // @ts-expect-error - Custom property
          fabricImg.isMainImage = true;
          canvasInstance.current!.add(fabricImg);
          canvasInstance.current!.requestRenderAll();
        });
      };
      imgElement.src = imageUrl;
      
    } catch (err) {
      if (!isCancelled?.()) {
        console.error('Error processing image:', err);
        onLoadingChange(false);
      }
    }
  };

  // Process uploaded file
  useEffect(() => {
    if (!file || !canvasInstance.current || !bgCanvasInstance.current || !containerRef.current) return;
    
    let cancelled = false;

    // Reset state
    strokeHistoryRef.current = [];
    originalImageRef.current = null;
    setZoomLevel(1);
    canvasInstance.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    bgCanvasInstance.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    // Revoke old blob
    if (resultUrl && resultUrl.startsWith('blob:')) {
        URL.revokeObjectURL(resultUrl);
    }
    setResultUrl(null);

    processImage(false, () => cancelled);
    
    return () => {
      cancelled = true;
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
      
      {/* Background Canvas (Layer 0) */}
      <div className="absolute z-10 w-auto h-auto">
         <canvas ref={bgCanvasEl} />
      </div>

      {/* Foreground Canvas (Layer 1) */}
      <div className="absolute z-20 w-auto h-auto" style={{ pointerEvents: isEraserMode ? 'auto' : 'none' }}> 
         <canvas ref={canvasEl} />
      </div>
      
      {/* Zoom Controls */}
      {resultUrl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10">
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 text-xs text-neutral-400 bg-black/50 px-3 py-1.5 rounded-full">
          Scroll to zoom • Alt+drag to pan
        </div>
      )}
    </div>
  );
});

RemoveBgCanvas.displayName = 'RemoveBgCanvas';

export default RemoveBgCanvas;
