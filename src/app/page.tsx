'use client';

import React, { useRef, useState } from 'react';
import EditorCanvas, { EditorCanvasRef } from '@/components/EditorCanvas';
import ComparisonView from '@/components/ComparisonView';
import { Upload, Type, Download, Loader2, Layers, Scissors, ImagePlus } from 'lucide-react';

type EditorMode = 'remove-bg' | 'text-behind';

export default function Home() {
  const editorRef = useRef<EditorCanvasRef>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<EditorMode>('remove-bg');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setActiveFile(e.target.files[0]);
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
    setActiveFile(null); // Reset file when switching modes
  };

  return (
    <main className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      {/* Main Canvas Area */}
      <div className="flex-grow relative bg-neutral-900/50 flex items-center justify-center p-8">
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-[#1a1a1a]">
          {!activeFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-4">
              {mode === 'remove-bg' ? (
                <>
                  <Scissors className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Upload an image to compare background removal</p>
                  <p className="text-sm text-neutral-600">Node.js vs Python side-by-side</p>
                </>
              ) : (
                <>
                  <Layers className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Upload an image to add text behind the subject</p>
                </>
              )}
            </div>
          ) : mode === 'remove-bg' ? (
            <ComparisonView file={activeFile} />
          ) : (
            <EditorCanvas 
              ref={editorRef} 
              file={activeFile} 
              onLoadingChange={setIsLoading} 
            />
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-white font-medium text-lg animate-pulse">
                {mode === 'remove-bg' ? 'Removing background...' : 'Analyzing image layers...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 bg-neutral-950 border-l border-white/10 p-6 flex flex-col gap-6 z-10 shrink-0">
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">LayerWiz</h1>
            <p className="text-xs text-neutral-400">Image Effects Editor</p>
          </div>
        </div>

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
              <span className="text-xs font-medium">Text Behind</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section: Source */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Source</h2>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button className="w-full py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center gap-3 group-hover:shadow-lg group-active:scale-[0.98]">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-medium text-sm">Upload Photo</span>
                  <span className="block text-xs text-neutral-500">JPG, PNG, WebP</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Text (only for text-behind mode) */}
          {mode === 'text-behind' && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Layers</h2>
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

              {/* Text Customization */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Text Style</h3>
                
                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Font</label>
                  <select
                    onChange={(e) => editorRef.current?.updateTextStyle('fontFamily', e.target.value)}
                    className="w-full py-2 px-3 bg-neutral-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    defaultValue="Arial Black, Arial, sans-serif"
                  >
                    <option value="Arial Black, Arial, sans-serif">Arial Black</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Comic Sans MS, cursive">Comic Sans</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Size</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    defaultValue="50"
                    onChange={(e) => editorRef.current?.updateTextStyle('fontSize', parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Text Color */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Color</label>
                  <div className="flex gap-2">
                    {['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'].map((color) => (
                      <button
                        key={color}
                        onClick={() => editorRef.current?.updateTextStyle('fill', color)}
                        className="w-7 h-7 rounded-lg border-2 border-white/20 hover:border-white/50 transition-colors hover:scale-110"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info text for remove-bg mode */}
          {mode === 'remove-bg' && activeFile && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-neutral-400">
                Processing both backends side-by-side. Each result can be downloaded independently.
              </p>
            </div>
          )}

        </div>

        {/* Download button - only for text-behind mode */}
        {mode === 'text-behind' && (
          <div className="mt-auto pt-6 border-t border-white/10">
            <button
              onClick={() => editorRef.current?.download()}
              disabled={!activeFile || isLoading}
              className="w-full py-4 text-white rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <Download className="w-4 h-4" />
              Export Composition
            </button>
          </div>
        )}
      </aside>
    </main>
  );
}
