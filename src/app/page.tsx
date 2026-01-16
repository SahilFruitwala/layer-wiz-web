'use client';

import React, { useRef, useState } from 'react';
import EditorCanvas, { EditorCanvasRef } from '@/components/EditorCanvas';
import { Upload, Type, Download, Loader2, Layers } from 'lucide-react';

export default function Home() {
  const editorRef = useRef<EditorCanvasRef>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setActiveFile(e.target.files[0]);
    }
  };

  return (
    <main className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      {/* Main Canvas Area */}
      <div className="flex-grow relative bg-neutral-900/50 flex items-center justify-center p-8">
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-[#1a1a1a]">
          {!activeFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-4">
              <Layers className="w-16 h-16 opacity-20" />
              <p className="text-lg">Upload an image to start creating</p>
            </div>
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
              <p className="text-white font-medium text-lg animate-pulse">Analyzing image layers...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 bg-neutral-950 border-l border-white/10 p-6 flex flex-col gap-8 z-10 shrink-0">
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">LayerWiz</h1>
            <p className="text-xs text-neutral-400">Depth Effect Editor</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section: Image */}
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

          {/* Section: Text */}
          <div className="space-y-3">
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
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            onClick={() => editorRef.current?.download()}
            disabled={!activeFile || isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/40 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            Export Composition
          </button>
        </div>
      </aside>
    </main>
  );
}
