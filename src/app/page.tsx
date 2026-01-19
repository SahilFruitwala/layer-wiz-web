'use client';

import React, { useRef, useState } from 'react';
import EditorCanvas, { EditorCanvasRef } from '@/components/EditorCanvas';
import RemoveBgCanvas, { RemoveBgCanvasRef, TextOptions } from '@/components/RemoveBgCanvas';
import BulkImageProcessor from '@/components/BulkImageProcessor';
import { LayeringControls, BackgroundConfig } from '@/components/LayeringControls';
import { 
  Upload, Type, Download, Loader2, Layers, Scissors, ImagePlus, 
  Eraser, MousePointer2, RotateCcw, RefreshCw, Palette, Sparkles, 
  ChevronUp, ChevronDown, X, Wand2
} from 'lucide-react';

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
  const [isPrepPhase, setIsPrepPhase] = useState(false);
  
  // Mobile bottom sheet state
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  // Eraser tool state
  const [eraserMode, setEraserMode] = useState(false);
  const [brushSize, setBrushSize] = useState(30);

  // Background state
  const [currentBackground, setCurrentBackground] = useState<BackgroundConfig>({ type: 'transparent', value: '' });
  
  // Selected Text State
  const [activeObject, setActiveObject] = useState<any>(null);

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
        setIsPrepPhase(true);
      } else {
        setActiveFile(null);
        setIsPrepPhase(false);
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

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 animate-pulse-glow">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text">LayerWiz</h1>
            <p className="text-[11px] text-neutral-500 font-medium">AI-Powered Image Editor</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Mode Selector - Pill Style */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Editor Mode
          </h2>
          <div className="bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleModeChange('remove-bg')}
                disabled={isLoading}
                className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-medium text-sm ${
                  mode === 'remove-bg'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                } disabled:opacity-50 disabled:cursor-not-allowed btn-press`}
              >
                <Scissors className="w-4 h-4" />
                <span className="hidden sm:inline">Remove BG</span>
                <span className="sm:hidden">Remove</span>
              </button>
              <button
                onClick={() => handleModeChange('text-behind')}
                disabled={isLoading}
                className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-medium text-sm ${
                  mode === 'text-behind'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                } disabled:opacity-50 disabled:cursor-not-allowed btn-press`}
              >
                <ImagePlus className="w-4 h-4" />
                <span className="hidden sm:inline">Text Behind</span>
                <span className="sm:hidden">Text</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Source Image
          </h2>
          <div className={`relative group ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="w-full py-4 px-4 glass hover:bg-white/10 rounded-2xl transition-all flex items-center gap-4 group-hover:shadow-lg group-active:scale-[0.98] btn-press hover-lift">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-semibold text-sm text-white">Upload Photo(s)</span>
                <span className="block text-xs text-neutral-500">JPG, PNG, WebP • Max 20MB</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronUp className="w-4 h-4 text-neutral-400 -rotate-45" />
              </div>
            </button>
          </div>
        </div>

        {/* Editor Controls */}
        {mode === 'remove-bg' && activeFile && (
          <div className="space-y-4 animate-scale-in">
            {/* Prep Phase Header */}
            {isPrepPhase && (
              <div className="p-4 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Ready to Process
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Click below to start AI background removal with BiRefNet.
                </p>
                <button 
                  onClick={async () => {
                    await removeBgRef.current?.triggerRemoveBackground();
                    setIsPrepPhase(false);
                    setSidebarTab('layers');
                  }}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-press hover-lift"
                >
                  <Scissors className="w-4 h-4" /> Remove Background
                </button>
              </div>
            )}

            {/* Tab Switcher */}
            <div className="flex bg-neutral-900/80 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setSidebarTab('cleanup')}
                disabled={isLoading}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'cleanup' 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-white'
                } disabled:opacity-50`}
              >
                <Eraser className="w-3.5 h-3.5" /> Cleanup
              </button>
              <button 
                onClick={() => {
                  setSidebarTab('layers');
                  handleEraserToggle(false);
                }}
                disabled={isLoading}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'layers' 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-white'
                } disabled:opacity-50`}
              >
                <Palette className="w-3.5 h-3.5" /> Background
              </button>
            </div>

            {sidebarTab === 'cleanup' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEraserToggle(false)}
                    disabled={isLoading}
                    className={`py-3.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 btn-press ${
                      !eraserMode
                        ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <MousePointer2 className="w-5 h-5" />
                    <span className="text-xs font-semibold">Select</span>
                  </button>
                  <button
                    onClick={() => handleEraserToggle(true)}
                    disabled={isLoading}
                    className={`py-3.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 btn-press ${
                      eraserMode
                        ? 'bg-red-600/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Eraser className="w-5 h-5" />
                    <span className="text-xs font-semibold">Eraser</span>
                  </button>
                </div>

                {eraserMode && (
                  <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5 animate-scale-in">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-neutral-400 font-medium">Brush Size</label>
                      <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={brushSize}
                      disabled={isLoading}
                      onChange={(e) => handleBrushSizeChange(parseInt(e.target.value))}
                      className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => removeBgRef.current?.undo()}
                    disabled={isLoading}
                    className="py-3 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed btn-press"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs font-semibold">Undo</span>
                  </button>
                  <button
                    onClick={() => removeBgRef.current?.reset()}
                    disabled={isLoading}
                    className="py-3 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed btn-press"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-xs font-semibold">Reset</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <LayeringControls 
                  currentBackground={currentBackground}
                  onBackgroundChange={handleBackgroundChange}
                  onAddText={handleAddText}
                  activeFile={activeFile}
                  isLoading={isLoading}
                  activeObject={activeObject}
                  onUpdateText={(opts) => removeBgRef.current?.updateText(opts)}
                />
              </div>
            )}
          </div>
        )}

        {/* Legacy Editor Text Controls */}
        {mode === 'text-behind' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Text Controls
            </h2>
            <button
              onClick={() => editorRef.current?.addText()}
              disabled={!activeFile || isLoading}
              className="w-full py-4 px-4 glass hover:bg-white/10 rounded-2xl transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed hover-lift btn-press"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Type className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-semibold text-sm">Add Text</span>
                <span className="block text-xs text-neutral-500">Insert behind subject</span>
              </div>
            </button>

            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Text Style</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Font</label>
                <select
                  onChange={(e) => editorRef.current?.updateTextStyle('fontFamily', e.target.value)}
                  className="w-full py-2.5 px-3 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  defaultValue="Arial Black, Arial, sans-serif"
                >
                  <option value="Arial Black, Arial, sans-serif">Arial Black</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Size</label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  defaultValue="50"
                  onChange={(e) => editorRef.current?.updateTextStyle('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Color</label>
                <div className="flex flex-wrap gap-2">
                  {['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d5e2'].map((color) => (
                    <button
                      key={color}
                      onClick={() => editorRef.current?.updateTextStyle('fill', color)}
                      className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/50 transition-all hover:scale-110 btn-press"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="p-5 border-t border-white/10 bg-neutral-950/80 backdrop-blur-lg">
        <button
          onClick={() => {
            if (mode === 'remove-bg') {
              removeBgRef.current?.download();
            } else {
              editorRef.current?.download();
            }
          }}
          disabled={!activeFile || isLoading}
          className={`w-full py-4 text-white rounded-2xl font-semibold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-press hover-lift ${
            mode === 'remove-bg'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25 hover:shadow-blue-500/40'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25 hover:shadow-purple-500/40'
          }`}
        >
          <Download className="w-5 h-5" />
          {mode === 'remove-bg' ? 'Download Result' : 'Export Composition'}
        </button>
      </div>
    </div>
  );

  return (
    <main className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      {/* Main Canvas Area */}
      <div className="flex-grow relative flex items-center justify-center p-4 lg:p-8 grid-pattern">
        <div className="relative w-full h-full max-w-6xl max-h-[85vh] lg:max-h-[80vh] rounded-2xl lg:rounded-3xl overflow-hidden gradient-border gradient-glow bg-neutral-900/90 backdrop-blur-sm">
          {!activeFile && activeFiles.length <= 1 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-6 p-8">
              <div className="relative">
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10 animate-float">
                  {mode === 'remove-bg' ? (
                    <Scissors className="w-12 h-12 lg:w-16 lg:h-16 text-blue-400/50" />
                  ) : (
                    <Layers className="w-12 h-12 lg:w-16 lg:h-16 text-purple-400/50" />
                  )}
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg lg:text-xl font-semibold text-neutral-300">
                  {mode === 'remove-bg' ? 'Upload an image to remove its background' : 'Upload an image to add text behind the subject'}
                </p>
                <p className="text-sm text-neutral-600">
                  {mode === 'remove-bg' ? 'Powered by BiRefNet (SOTA 2024)' : 'Create stunning layered compositions'}
                </p>
              </div>
              
              {/* Mobile Upload Hint */}
              <button 
                onClick={() => setIsBottomSheetOpen(true)}
                className="lg:hidden mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-sm flex items-center gap-2 btn-press"
              >
                <Upload className="w-4 h-4" /> Get Started
              </button>
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
              isPrepMode={isPrepPhase}
              onLoadingChange={setIsLoading}
              onProgressChange={setProgress}
              onSelectionChange={setActiveObject}
            />
          ) : (
            <EditorCanvas 
              ref={editorRef} 
              file={activeFile} 
              onLoadingChange={setIsLoading}
              onProgressChange={setProgress}
            />
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-fade-in">
              <div className="relative w-28 h-28 lg:w-36 lg:h-36 mb-8">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                
                {/* Animated gradient ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                
                {/* Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {progress}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">percent</span>
                </div>
              </div>
              
              <div className="text-center space-y-2 max-w-xs">
                <h3 className="text-xl lg:text-2xl font-bold text-white">
                  {progress < 100 ? 'Processing...' : 'Finalizing...'}
                </h3>
                <p className="text-neutral-400 text-sm">
                  {isPrepPhase ? 'Preparing your image' : 'AI is isolating the subject'}
                </p>
                {progress > 80 && (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-600 uppercase tracking-widest mt-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    Almost there
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 xl:w-96 bg-neutral-950/95 backdrop-blur-xl border-l border-white/10 flex-col z-10 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Bottom Sheet Toggle */}
      <button
        onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center btn-press hover-lift"
      >
        {isBottomSheetOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <ChevronUp className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Bottom Sheet */}
      <div 
        className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-neutral-950/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out ${
          isBottomSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        <div className="bottom-sheet-handle"></div>
        <div className="h-full overflow-hidden" style={{ maxHeight: 'calc(75vh - 28px)' }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      {isBottomSheetOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20 animate-fade-in"
          onClick={() => setIsBottomSheetOpen(false)}
        />
      )}
    </main>
  );
}
