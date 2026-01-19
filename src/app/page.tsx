'use client';

import React, { useRef, useState } from 'react';
import EditorCanvas, { EditorCanvasRef } from '@/components/EditorCanvas';
import RemoveBgCanvas, { RemoveBgCanvasRef } from '@/components/RemoveBgCanvas';
import BulkImageProcessor from '@/components/BulkImageProcessor';
import { LayeringControls, BackgroundConfig } from '@/components/LayeringControls';
import { Upload, Type, Download, Loader2, Layers, Scissors, ImagePlus, Eraser, MousePointer2, RotateCcw, RefreshCw, Palette } from 'lucide-react';

type EditorMode = 'remove-bg' | 'text-behind';
type SidebarTab = 'cleanup' | 'layers';

export default function Home() {
  const editorRef = useRef<EditorCanvasRef>(null);
  const removeBgRef = useRef<RemoveBgCanvasRef>(null);
  const [activeFiles, setActiveFiles] = useState<File[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<EditorMode>('remove-bg');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('cleanup');
  
  // Eraser tool state
  const [eraserMode, setEraserMode] = useState(false);
  const [brushSize, setBrushSize] = useState(30);

  // Background state
  const [currentBackground, setCurrentBackground] = useState<BackgroundConfig>({ type: 'transparent', value: '' });
  
  const handleEraserToggle = (enabled: boolean) => {
    setEraserMode(enabled);
    removeBgRef.current?.setEraserMode(enabled);
  };
  
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    removeBgRef.current?.setBrushSize(size);
  };

  const handleBackgroundChange = (config: BackgroundConfig) => {
    setCurrentBackground(config);
    removeBgRef.current?.setBackground(config.type, config.value);
  };

  const handleAddText = () => {
    removeBgRef.current?.addText();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setActiveFiles(files);
      
      if (files.length === 1) {
        setActiveFile(files[0]);
      } else {
        setActiveFile(null); // Bulk mode doesn't use activeFile
      }
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
    setActiveFile(null);
    setActiveFiles([]);
    setEraserMode(false);
    setCurrentBackground({ type: 'transparent', value: '' });
  };

  return (
    <main className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      {/* Main Canvas Area */}
      <div className="flex-grow relative bg-neutral-900/50 flex items-center justify-center p-8">
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-[#1a1a1a]">
          {!activeFile && activeFiles.length <= 1 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-4">
              {mode === 'remove-bg' ? (
                <>
                  <Scissors className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Upload an image to remove its background</p>
                  <p className="text-sm text-neutral-600">Powered by BiRefNet (SOTA 2024)</p>
                </>
              ) : (
                <>
                  <Layers className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Upload an image to add text behind the subject</p>
                </>
              )}
            </div>
          ) : activeFiles.length > 1 && mode === 'remove-bg' ? (
            <BulkImageProcessor 
              files={activeFiles}
              onBack={() => {
                setActiveFiles([]);
                setActiveFile(null);
              }}
            />
          ) : mode === 'remove-bg' ? (
            <RemoveBgCanvas 
              ref={removeBgRef} 
              file={activeFile} 
              onLoadingChange={setIsLoading}
              onProgressChange={setProgress}
            />
          ) : (
            <EditorCanvas 
              ref={editorRef} 
              file={activeFile} 
              onLoadingChange={setIsLoading}
              onProgressChange={setProgress}
            />
          )}

          {/* Loading Overlay with Progress */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
              <div className="relative w-24 h-24 mb-6">
                {/* Circular progress background */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                    className="transition-all duration-200"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{progress}%</span>
                </div>
              </div>
              <p className="text-white font-medium text-lg">
                {mode === 'remove-bg' ? 'Removing background...' : 'Analyzing layers...'}
              </p>
              <p className="text-neutral-400 text-sm mt-2">BiRefNet (SOTA 2024)</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 bg-neutral-950 border-l border-white/10 flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-xl tracking-tight">LayerWiz</h1>
                <p className="text-xs text-neutral-400">Image Effects Editor</p>
            </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Mode Selector */}
            <div className="space-y-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Mode</h2>
            <div className="grid grid-cols-2 gap-2">
                <button
                onClick={() => handleModeChange('remove-bg')}
                className={`py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    mode === 'remove-bg'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                }`}
                >
                <Scissors className="w-5 h-5" />
                <span className="text-xs font-medium">Remove BG</span>
                </button>
                <button
                onClick={() => handleModeChange('text-behind')}
                className={`py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    mode === 'text-behind'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                }`}
                >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-medium">Legacy Editor</span>
                </button>
            </div>
            </div>

            {/* Section: Source */}
            <div className="space-y-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Source</h2>
            <div className="relative group">
                <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button className="w-full py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center gap-3 group-hover:shadow-lg group-active:scale-[0.98]">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-blue-400">
                    <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <span className="block font-medium text-sm">Upload Photo(s)</span>
                    <span className="block text-xs text-neutral-500">JPG, PNG, WebP</span>
                </div>
                </button>
            </div>
            </div>

            {/* Editor Tabs (Only for remove-bg mode + active file) */}
            {mode === 'remove-bg' && activeFile && !isLoading && (
                <div className="space-y-4">
                     {/* Tab Switcher */}
                     <div className="flex bg-white/5 p-1 rounded-lg">
                        <button 
                            onClick={() => setSidebarTab('cleanup')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                sidebarTab === 'cleanup' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Eraser className="w-3.5 h-3.5" /> Cleanup
                        </button>
                         <button 
                            onClick={() => {
                                setSidebarTab('layers');
                                handleEraserToggle(false); // Disable eraser when switching to layers
                            }}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                sidebarTab === 'layers' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Palette className="w-3.5 h-3.5" /> Background
                        </button>
                     </div>

                    {sidebarTab === 'cleanup' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                            onClick={() => handleEraserToggle(false)}
                            className={`py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                !eraserMode
                                ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                            }`}
                            >
                            <MousePointer2 className="w-5 h-5" />
                            <span className="text-xs font-medium">Select</span>
                            </button>
                            <button
                            onClick={() => handleEraserToggle(true)}
                            className={`py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                eraserMode
                                ? 'bg-red-600/20 border-red-500 text-red-400'
                                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                            }`}
                            >
                            <Eraser className="w-5 h-5" />
                            <span className="text-xs font-medium">Eraser</span>
                            </button>
                        </div>

                        {eraserMode && (
                            <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-neutral-400">Brush Size</label>
                                <span className="text-xs text-neutral-500">{brushSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={brushSize}
                                onChange={(e) => handleBrushSizeChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <button
                            onClick={() => removeBgRef.current?.undo()}
                            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 text-neutral-400 hover:text-white"
                            >
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-xs font-medium">Undo</span>
                            </button>
                            <button
                            onClick={() => removeBgRef.current?.reset()}
                            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 text-neutral-400 hover:text-white"
                            >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-xs font-medium">Reset</span>
                            </button>
                        </div>
                        </div>
                    ) : (
                        <div className="h-[400px] animate-in fade-in slide-in-from-right-4 duration-300">
                             <LayeringControls 
                                currentBackground={currentBackground}
                                onBackgroundChange={handleBackgroundChange}
                                onAddText={handleAddText}
                             />
                        </div>
                    )}
                </div>
            )}

            {/* Legacy Editor Text Controls */}
            {mode === 'text-behind' && (
                <div className="space-y-4">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Legacy Text</h2>
                <button
                    onClick={() => editorRef.current?.addText()}
                    disabled={!activeFile || isLoading}
                    className="w-full py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
                >
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-purple-400">
                    <Type className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                    <span className="block font-medium text-sm">Add Text</span>
                    <span className="block text-xs text-neutral-500">Insert behind subject</span>
                    </div>
                </button>
                 <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-500">
                        Tip: Try the "Remove BG" mode for the new Advanced Layering features including Text Behind!
                    </p>
                 </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-white/10 bg-neutral-950">
            <button
            onClick={() => {
                if (mode === 'remove-bg') {
                removeBgRef.current?.download();
                } else {
                editorRef.current?.download();
                }
            }}
            disabled={!activeFile || isLoading}
            className={`w-full py-4 text-white rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 ${
                mode === 'remove-bg'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25 hover:shadow-blue-500/40'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25 hover:shadow-blue-500/40'
            }`}
            >
            <Download className="w-4 h-4" />
            {mode === 'remove-bg' ? 'Download Result' : 'Export Composition'}
            </button>
        </div>
      </aside>
    </main>
  );
}
