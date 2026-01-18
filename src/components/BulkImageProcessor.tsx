'use client';

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Download, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Eye, X } from 'lucide-react';
import { useBackgroundRemover } from '@/hooks/useBackgroundRemover';

interface BulkImageProcessorProps {
  files: File[];
  onBack: () => void;
}

interface ProcessedFile {
  originalFile: File;
  resultUrl: string | null;
  error: string | null;
  isLoading: boolean;
  progress: number;
}

const BulkItem = ({ 
  file, 
  onComplete,
  onPreview
}: { 
  file: File; 
  onComplete: (file: File, url: string | null, error: string | null) => void;
  onPreview: (file: File) => void;
}) => {
  const { removeBackground, isLoading, progress, error, processingTime } = useBackgroundRemover();
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const process = async () => {
      try {
        const url = await removeBackground(file);
        setProcessedUrl(url);
        onComplete(file, url, null);
      } catch (err) {
        onComplete(file, null, err instanceof Error ? err.message : 'Failed');
      }
    };

    process();
  }, [file, removeBackground, onComplete]);

  return (
    <div className="bg-neutral-800/50 rounded-xl overflow-hidden border border-white/10 flex flex-col group relative">
      <div className="relative aspect-square bg-neutral-900 border-b border-white/5">
        {/* Transparency grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #333 25%, transparent 25%),
              linear-gradient(-45deg, #333 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #333 75%),
              linear-gradient(-45deg, transparent 75%, #333 75%)
            `,
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
          }}
        />
        
        {processedUrl ? (
          <img 
            src={processedUrl} 
            alt="Processed" 
            className="absolute inset-0 w-full h-full object-contain p-2" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4">
             <img 
              src={URL.createObjectURL(file)} 
              alt="Original" 
              className="max-w-full max-h-full opacity-50 grayscale" 
            />
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <div className="text-xs text-white font-mono">{progress}%</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <span className="text-xs text-red-200">{error}</span>
          </div>
        )}
        
        {!isLoading && !error && processedUrl && (
           <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
             <CheckCircle2 className="w-4 h-4 text-white" />
           </div>
        )}
        
        {/* Preview Button */}
        <button
          onClick={() => onPreview(file)}
          className="absolute bottom-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 flex items-center justify-between gap-2 bg-neutral-800">
        <div className="truncate text-xs text-neutral-400 font-medium flex-1" title={file.name}>
          {file.name}
        </div>
        
        {processedUrl && (
          <a 
            href={processedUrl} 
            download={`removed-${file.name.replace(/\.[^/.]+$/, "")}.png`}
            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};

export default function BulkImageProcessor({ files, onBack }: BulkImageProcessorProps) {
  const [results, setResults] = useState<Map<string, string | null>>(new Map());
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const handleComplete = (file: File, url: string | null, error: string | null) => {
    if (url) {
      setResults(prev => new Map(prev).set(file.name, url));
    }
  };

  const downloadAll = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      const promises = Array.from(results.entries()).map(async ([filename, url]) => {
        if (!url) return;
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(`processed-${filename.replace(/\.[^/.]+$/, "")}.png`, blob);
      });

      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "batch_removed_bg.zip";
      link.click();
    } catch (e) {
      console.error("Failed to zip files", e);
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = results.size;
  const totalCount = files.length;
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-neutral-900/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Bulk Processing</h2>
            <p className="text-sm text-neutral-400">{completedCount} of {totalCount} processed</p>
          </div>
        </div>

        <button 
          onClick={downloadAll}
          disabled={completedCount === 0 || isZipping}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download All
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
          {files.map((file, index) => (
            <BulkItem 
              key={`${file.name}-${index}`} 
              file={file} 
              onComplete={handleComplete}
              onPreview={setPreviewFile}
            />
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setPreviewFile(null)}
        >
          <button 
            onClick={() => setPreviewFile(null)}
            className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div 
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Transparency grid for modal */}
            <div 
              className="absolute inset-0 -z-10 rounded-lg overflow-hidden opacity-20"
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
              src={results.get(previewFile.name) || URL.createObjectURL(previewFile)} 
              alt={previewFile.name}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-white font-medium text-sm">
              {previewFile.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
