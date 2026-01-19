
import React, { useState, useEffect } from 'react';
import { Palette, Image as ImageIcon, Type, Upload, Sparkles, Loader2, Search } from 'lucide-react';

export type BackgroundType = 'transparent' | 'color' | 'gradient' | 'image';

export interface BackgroundConfig {
  type: BackgroundType;
  value: string; // Hex, gradient css, or image url
}

interface LayeringControlsProps {
  currentBackground: BackgroundConfig;
  onBackgroundChange: (config: BackgroundConfig) => void;
  onAddText: () => void;
  activeFile: File | null;
  isLoading?: boolean;
}

const SOLID_COLORS = [
  '#ffffff', '#000000', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

const GRADIENTS = [
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
  'linear-gradient(to top, #96fbc4 0%, #f9f586 100%)',
  'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  'linear-gradient(to top, #5ee7df 0%, #b490ca 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
];

export const LayeringControls: React.FC<LayeringControlsProps> = ({
  currentBackground,
  onBackgroundChange,
  onAddText,
  activeFile,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'color' | 'gradient' | 'image' | 'ai' | 'text'>('color');
  
  // AI State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Unsplash State
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load initial Unsplash images
  useEffect(() => {
    if (activeTab === 'image' && unsplashImages.length === 0) {
        fetchUnsplash('');
    }
  }, [activeTab]);

  const fetchUnsplash = async (query: string) => {
      setIsSearching(true);
      try {
          const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`);
          const data = await res.json();
          // Adjust based on API structure (search returns { results: [] })
          const results = data.results || data; 
          if (Array.isArray(results)) {
             setUnsplashImages(results);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearching(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onBackgroundChange({ type: 'image', value: url });
    }
  };

  const handleGenerateBg = async () => {
      if (!prompt.trim()) return;
      setIsGenerating(true);
      try {
          const res = await fetch('/api/generate-bg', {
              method: 'POST',
              body: JSON.stringify({ prompt }),
              headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.url) {
              onBackgroundChange({ type: 'image', value: data.url });
          } else if (data.mock && data.url) {
               onBackgroundChange({ type: 'image', value: data.url });
               alert("Gemini/OpenAI Key missing. Used mock image.");
          } else {
              alert(data.error || "Failed to generate");
          }
      } catch (e) {
          console.error(e);
          alert("Error generating background");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full bg-black/40 p-4 backdrop-blur-md rounded-xl border border-white/10">
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('color')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
            activeTab === 'color' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          } disabled:opacity-50`}
        >
          <Palette className="w-4 h-4" /> Solid
        </button>
        <button
          onClick={() => setActiveTab('gradient')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
            activeTab === 'gradient' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          } disabled:opacity-50`}
        >
          <div className="w-4 h-4 rounded-sm bg-gradient-to-tr from-blue-400 to-purple-500" /> Gradient
        </button>
        <button
          onClick={() => setActiveTab('image')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
            activeTab === 'image' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          } disabled:opacity-50`}
        >
          <ImageIcon className="w-4 h-4" /> Image
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
            activeTab === 'ai' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          } disabled:opacity-50`}
        >
          <Sparkles className="w-4 h-4" /> AI
        </button>
        <button
          onClick={() => setActiveTab('text')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
            activeTab === 'text' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          } disabled:opacity-50`}
        >
          <Type className="w-4 h-4" /> Layers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'color' && (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onBackgroundChange({ type: 'transparent', value: '' })}
              className={`aspect-square rounded-lg border-2 overflow-hidden relative ${
                currentBackground.type === 'transparent' ? 'border-blue-500' : 'border-transparent'
              }`}
              title="Transparent"
            >
               <div className="absolute inset-0 opacity-50" 
                    style={{
                        backgroundImage: `linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)`,
                        backgroundSize: '10px 10px',
                        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                    }}
               />
               <div className="absolute inset-0 flex items-center justify-center text-xs text-white bg-black/50">None</div>
            </button>
            {SOLID_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onBackgroundChange({ type: 'color', value: color })}
                disabled={isLoading}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                  currentBackground.value === color && currentBackground.type === 'color' ? 'border-white scale-105' : 'border-transparent'
                } disabled:pointer-events-none disabled:opacity-50`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {activeTab === 'gradient' && (
          <div className="grid grid-cols-2 gap-2">
            {GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                onClick={() => onBackgroundChange({ type: 'gradient', value: gradient })}
                disabled={isLoading}
                className={`h-16 rounded-lg border-2 transition-all hover:scale-105 ${
                  currentBackground.value === gradient && currentBackground.type === 'gradient' ? 'border-white scale-105' : 'border-transparent'
                } disabled:pointer-events-none disabled:opacity-50`}
                style={{ background: gradient }}
              />
            ))}
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-4">
             <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5 hover:border-white/40'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                    <p className="text-xs text-neutral-400">Upload Background</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isLoading} />
            </label>
            
            <div className="space-y-2">
                 <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Unsplash Library</h3>
                 <div className="relative">
                    <input 
                        type="text" 
                        value={unsplashQuery}
                        onChange={(e) => setUnsplashQuery(e.target.value)}
                        disabled={isLoading}
                        placeholder="Search photos..." 
                        className="w-full py-2 px-3 pl-9 bg-neutral-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                        onKeyDown={(e) => e.key === 'Enter' && fetchUnsplash(unsplashQuery)}
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {isSearching ? (
                        <div className="col-span-2 flex justify-center py-8">
                             <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                        </div>
                    ) : unsplashImages.length > 0 ? (
                        unsplashImages.map((img) => (
                            <button 
                                key={img.id}
                                onClick={() => onBackgroundChange({ type: 'image', value: img.urls.regular })}
                                disabled={isLoading}
                                className="relative aspect-video rounded-lg overflow-hidden group hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <img src={img.urls.regular} alt={img.alt_description} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </button>
                        ))
                    ) : (
                        <p className="col-span-2 text-center text-xs text-neutral-500 py-4">
                            No images found.
                        </p>
                    )}
                 </div>
                 <div className="text-center">
                    <span className="text-[10px] text-neutral-500">Photos by Unsplash</span>
                 </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
           <div className="space-y-4">
              <div className="space-y-2 relative">
                 <label className="text-xs text-neutral-400">Describe your background</label>
                 <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="e.g. A cyberpunk city at night with neon lights..."
                   disabled={isLoading || isGenerating}
                   className="w-full h-24 bg-neutral-800 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-blue-500 transition-colors pr-10 disabled:opacity-50"
                 />
                  <button
                    onClick={async () => {
                        if (!activeFile) {
                            alert("Please upload an image first for smart analysis!");
                            return;
                        }
                        try {
                            setIsGenerating(true);
                            const reader = new FileReader();
                            reader.readAsDataURL(activeFile);
                            reader.onloadend = async () => {
                                const base64data = reader.result;
                                const res = await fetch('/api/analyze-image', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ image: base64data })
                                });
                                const data = await res.json();
                                if(data.suggestion) {
                                    setPrompt(data.suggestion);
                                } else {
                                    alert(data.error || "Failed to analyze image");
                                }
                                setIsGenerating(false);
                            }
                        } catch (e) {
                            console.error(e);
                            setIsGenerating(false);
                        }
                    }}
                    className="absolute bottom-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-purple-400 transition-colors disabled:opacity-50"
                    title="Smart Suggest (Gemini)"
                    disabled={isLoading || isGenerating}
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
              </div>
              <button
                onClick={handleGenerateBg}
                disabled={isLoading || isGenerating || !prompt.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                   </>
                ) : (
                   <>
                     <Sparkles className="w-4 h-4" /> Generate
                   </>
                )}
              </button>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                 <p className="text-xs text-blue-400">
                    Pro tip: Be specific about lighting, mood, and style. Imagen 4.0 creates high-quality backgrounds instantly.
                 </p>
              </div>
           </div>
        )}

        {activeTab === 'text' && (
           <div className="space-y-4">
               <button
                 onClick={onAddText}
                 disabled={isLoading}
                 className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Type className="w-4 h-4" /> Add Text Behind
               </button>
               <p className="text-xs text-neutral-400 text-center">
                 Text added here will appear behind the subject.
               </p>
           </div>
        )}
      </div>
    </div>
  );
};
