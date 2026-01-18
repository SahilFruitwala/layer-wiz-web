'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApiRemover, BackendType, RemovalResult } from '@/hooks/useApiRemover';
import { Loader2, Clock, Download } from 'lucide-react';

interface ComparisonViewProps {
  file: File;
}

interface BackendResult {
  result: RemovalResult | null;
  isLoading: boolean;
  error: string | null;
}

export default function ComparisonView({ file }: ComparisonViewProps) {
  const nodeRemover = useApiRemover();
  const pythonRemover = useApiRemover();
  
  const [nodeResult, setNodeResult] = useState<BackendResult>({ result: null, isLoading: false, error: null });
  const [pythonResult, setPythonResult] = useState<BackendResult>({ result: null, isLoading: false, error: null });
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  
  // Track if we've started processing to avoid duplicate calls
  const processingStarted = useRef({ node: false, python: false });

  // Create URL for original image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    
    // Reset results when file changes
    setNodeResult({ result: null, isLoading: false, error: null });
    setPythonResult({ result: null, isLoading: false, error: null });
    processingStarted.current = { node: false, python: false };
    
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const processWithBackend = async (backend: BackendType) => {
    const remover = backend === 'node' ? nodeRemover : pythonRemover;
    const setResult = backend === 'node' ? setNodeResult : setPythonResult;
    
    // Prevent duplicate processing
    if (processingStarted.current[backend]) return;
    processingStarted.current[backend] = true;
    
    setResult({ result: null, isLoading: true, error: null });
    
    try {
      const result = await remover.removeBackground(file, backend);
      setResult({ result, isLoading: false, error: null });
    } catch (err) {
      setResult({ 
        result: null, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Processing failed' 
      });
      processingStarted.current[backend] = false; // Allow retry on error
    }
  };

  const handleDownload = (result: RemovalResult | null, backend: BackendType) => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `bg-removed-${backend}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ms: number) => {
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  };

  const ResultPanel = ({ 
    backend, 
    result, 
    isLoading, 
    error,
    label,
    color 
  }: { 
    backend: BackendType;
    result: RemovalResult | null;
    isLoading: boolean;
    error: string | null;
    label: string;
    color: string;
  }) => (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Header */}
      <div className={`px-4 py-3 border-b border-white/10 flex items-center justify-between ${color}`}>
        <div>
          <h3 className="font-bold text-sm">{label}</h3>
          <p className="text-xs opacity-70">
            {backend === 'node' ? '@imgly/bg-removal (medium)' : 'BiRefNet (SOTA 2024)'}
          </p>
        </div>
        {result && (
          <button
            onClick={() => handleDownload(result, backend)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Result Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-neutral-900/50 overflow-hidden min-h-0">
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
        
        {!result && !isLoading && !error && (
          <button
            onClick={() => processWithBackend(backend)}
            className={`relative z-10 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:scale-105 active:scale-95 ${
              backend === 'node' 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
            }`}
          >
            Process with {label}
          </button>
        )}
        
        {isLoading && (
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="text-sm text-neutral-400">Processing...</span>
          </div>
        )}
        
        {error && (
          <div className="relative z-10 text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={() => processWithBackend(backend)}
              className="text-xs text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {result && (
          <img 
            src={result.url} 
            alt={`${label} result`}
            className="relative z-10 w-full h-full object-contain"
          />
        )}
      </div>
      
      {/* Timing footer */}
      {result && (
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-neutral-400">Time:</span>
          <span className="font-mono text-white">{formatTime(result.timing)}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Original preview bar */}
      {originalUrl && (
        <div className="h-16 border-b border-white/10 bg-neutral-800/50 flex items-center px-4 gap-4">
          <img 
            src={originalUrl} 
            alt="Original" 
            className="h-12 w-12 object-cover rounded-lg border border-white/20"
          />
          <div>
            <p className="text-sm font-medium text-white">Original Image</p>
            <p className="text-xs text-neutral-500">{file.name}</p>
          </div>
          <button
            onClick={() => {
              processingStarted.current = { node: false, python: false };
              processWithBackend('node');
              processWithBackend('python');
            }}
            className="ml-auto px-4 py-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-yellow-500 transition-all"
          >
            Process Both
          </button>
        </div>
      )}
      
      {/* Side by side comparison */}
      <div className="flex-1 flex min-h-0">
        <ResultPanel
          backend="node"
          result={nodeResult.result}
          isLoading={nodeResult.isLoading}
          error={nodeResult.error}
          label="Node.js"
          color="bg-green-900/30"
        />
        <div className="w-px bg-white/10" />
        <ResultPanel
          backend="python"
          result={pythonResult.result}
          isLoading={pythonResult.isLoading}
          error={pythonResult.error}
          label="Python"
          color="bg-yellow-900/30"
        />
      </div>
    </div>
  );
}
