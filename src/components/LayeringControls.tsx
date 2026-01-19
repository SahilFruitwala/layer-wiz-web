import React, { useState, useEffect } from 'react';
import { Palette, Image as ImageIcon, Type, Upload, Sparkles, Loader2, Search, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TextOptions } from './RemoveBgCanvas';

export type BackgroundType = 'transparent' | 'color' | 'gradient' | 'image';

export interface BackgroundConfig {
  type: BackgroundType;
  value: string;
}

interface LayeringControlsProps {
  currentBackground: BackgroundConfig;
  onBackgroundChange: (config: BackgroundConfig) => void;
  onAddText: () => void;
  activeFile: File | null;
  isLoading?: boolean;
  activeObject?: any;
  onUpdateText?: (options: TextOptions) => void;
}

const FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Lato', 'Oswald'];

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
  activeObject,
  onUpdateText
}) => {
  const [activeTab, setActiveTab] = useState<'color' | 'gradient' | 'image' | 'ai' | 'text'>('color');
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const tabs = [
    { id: 'color' as const, icon: Palette, label: 'Solid' },
    { id: 'gradient' as const, icon: null, label: 'Gradient', customIcon: true },
    { id: 'image' as const, icon: ImageIcon, label: 'Image' },
    { id: 'ai' as const, icon: Sparkles, label: 'AI' },
    { id: 'text' as const, icon: Type, label: 'Layers' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Tab Navigation - Scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 min-w-fit btn-press ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-lg' 
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            } disabled:opacity-50`}
          >
            {tab.customIcon ? (
              <div className="w-4 h-4 rounded bg-gradient-to-tr from-blue-400 to-purple-500" />
            ) : tab.icon ? (
              <tab.icon className="w-4 h-4" />
            ) : null}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar animate-fade-in">
        {activeTab === 'color' && (
          <div className="grid grid-cols-4 gap-2">
            {/* Transparent option */}
            <button
              onClick={() => onBackgroundChange({ type: 'transparent', value: '' })}
              className={`aspect-square rounded-xl border-2 overflow-hidden relative transition-all hover:scale-105 btn-press ${
                currentBackground.type === 'transparent' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/10 hover:border-white/30'
              }`}
              title="Transparent"
            >
              <div className="absolute inset-0 checkerboard opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white bg-black/40">None</div>
            </button>
            
            {SOLID_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onBackgroundChange({ type: 'color', value: color })}
                disabled={isLoading}
                className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 btn-press ${
                  currentBackground.value === color && currentBackground.type === 'color' 
                    ? 'border-white ring-2 ring-white/30 scale-105' 
                    : 'border-transparent hover:border-white/30'
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
                className={`h-16 rounded-xl border-2 transition-all hover:scale-[1.03] btn-press ${
                  currentBackground.value === gradient && currentBackground.type === 'gradient' 
                    ? 'border-white ring-2 ring-white/30' 
                    : 'border-transparent hover:border-white/30'
                } disabled:pointer-events-none disabled:opacity-50`}
                style={{ background: gradient }}
              />
            ))}
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-4">
            <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/20 rounded-xl transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5 hover:border-white/40'
            }`}>
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="w-5 h-5 text-neutral-400 mb-1.5" />
                <p className="text-xs text-neutral-400 font-medium">Upload Background</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isLoading} />
            </label>
            
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Unsplash Library</h3>
              <div className="relative">
                <input 
                  type="text" 
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  disabled={isLoading}
                  placeholder="Search photos..." 
                  className="w-full py-2.5 px-3 pl-10 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && fetchUnsplash(unsplashQuery)}
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
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
                      className="relative aspect-video rounded-xl overflow-hidden group hover:opacity-90 transition-all hover:scale-[1.02] btn-press disabled:opacity-30 disabled:pointer-events-none"
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
                <span className="text-[10px] text-neutral-600">Photos by Unsplash</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <label className="text-xs text-neutral-400 font-medium">Describe your background</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A cyberpunk city at night with neon lights..."
                disabled={isLoading || isGenerating}
                className="w-full h-24 bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-blue-500 transition-colors pr-12 disabled:opacity-50"
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
                className="absolute bottom-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-purple-400 transition-all disabled:opacity-50 btn-press"
                title="Smart Suggest (Gemini)"
                disabled={isLoading || isGenerating}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
            
            <button
              onClick={handleGenerateBg}
              disabled={isLoading || isGenerating || !prompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-press hover-lift shadow-lg shadow-purple-500/20"
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
            
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400 leading-relaxed">
                <strong>Pro tip:</strong> Be specific about lighting, mood, and style. Imagen 4.0 creates high-quality backgrounds instantly.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <button
              onClick={onAddText}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-press hover-lift shadow-lg shadow-blue-500/20"
            >
              <Type className="w-4 h-4" /> Add Text Behind
            </button>
            
            {activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text') && onUpdateText ? (
              <div className="space-y-4 pt-4 border-t border-white/10 animate-scale-in">
                {/* Font Family */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Font Family</label>
                  <select 
                    value={activeObject.fontFamily}
                    onChange={(e) => onUpdateText({ fontFamily: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                
                {/* Color Picker */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {SOLID_COLORS.slice(0, 10).map(c => (
                      <button
                        key={c}
                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 btn-press ${
                          activeObject.fill === c ? 'border-white ring-2 ring-white/30' : 'border-white/20 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => onUpdateText({ fill: c })}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Size Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-neutral-400 font-medium">Size</label>
                    <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">{activeObject.fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    value={activeObject.fontSize || 60} 
                    onChange={(e) => onUpdateText({ fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Text Formatting */}
                <div className="flex items-center gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => onUpdateText({ fontWeight: activeObject.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`p-2.5 rounded-lg flex-1 flex justify-center transition-all btn-press ${
                      activeObject.fontWeight === 'bold' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onUpdateText({ fontStyle: activeObject.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`p-2.5 rounded-lg flex-1 flex justify-center transition-all btn-press ${
                      activeObject.fontStyle === 'italic' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-5 bg-white/10 mx-1" />
                  
                  <button
                    onClick={() => onUpdateText({ textAlign: 'left' })}
                    className={`p-2.5 rounded-lg flex-1 flex justify-center transition-all btn-press ${
                      activeObject.textAlign === 'left' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateText({ textAlign: 'center' })}
                    className={`p-2.5 rounded-lg flex-1 flex justify-center transition-all btn-press ${
                      activeObject.textAlign === 'center' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateText({ textAlign: 'right' })}
                    className={`p-2.5 rounded-lg flex-1 flex justify-center transition-all btn-press ${
                      activeObject.textAlign === 'right' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 text-center py-6 bg-white/5 rounded-xl border border-white/5">
                Select a text object to edit its style
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
