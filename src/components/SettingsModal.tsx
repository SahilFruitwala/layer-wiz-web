'use client';

import React, { useState } from 'react';
import { Settings, X, Key, Cpu, ExternalLink, Check, AlertCircle, Plus } from 'lucide-react';
import { useGeminiConfig, AVAILABLE_MODELS } from '@/contexts/GeminiContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { config, setConfig, isConfigured } = useGeminiConfig();
  const [localApiKey, setLocalApiKey] = useState(config.apiKey);
  const [localModel, setLocalModel] = useState(config.model);
  const [showKey, setShowKey] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(!AVAILABLE_MODELS.find(m => m.id === config.model));

  const handleModelSelect = (modelId: string, isCustom: boolean) => {
    setLocalModel(modelId);
    setIsCustomModel(isCustom);
  };

  const handleSave = () => {
    setConfig({
      apiKey: localApiKey.trim(),
      model: localModel,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalApiKey('');
    setLocalModel('gemini-2.5-flash');
    setConfig({
      apiKey: '',
      model: 'gemini-2.5-flash',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-lg bg-neutral-950 border border-white/10 rounded-3xl shadow-2xl shadow-black/50 animate-scale-in overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <p className="text-xs text-neutral-500">Configure AI features</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Info Banner */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                What is Gemini used for?
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Gemini AI powers the <strong className="text-white">Smart Suggest</strong> feature, which analyzes your image and suggests creative backgrounds that complement your subject. This is optional—all other features work without an API key.
              </p>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-neutral-500" />
                  Gemini API Key
                </span>
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  Get free API key <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative">
                {showKey ? (
                  <textarea
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    rows={3}
                    className="w-full py-3 px-4 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all pr-14 resize-none custom-scrollbar"
                  />
                ) : (
                  <input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full py-3 px-4 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all pr-14"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors bg-neutral-900/80 px-2 py-1 rounded"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-600">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-neutral-500" />
                  Analysis Model
                </label>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Used for Smart Suggest to analyze images and suggest backgrounds
                </p>
              </div>
              <div className="space-y-2">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id, false)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      localModel === model.id && !isCustomModel
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-neutral-900/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${
                            localModel === model.id && !isCustomModel ? 'text-blue-400' : 'text-white'
                          }`}>
                            {model.name}
                          </span>
                          {model.recommended && (
                            <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{model.description}</p>
                      </div>
                      {localModel === model.id && !isCustomModel && (
                        <Check className="w-5 h-5 text-blue-400 shrink-0" />
                      )}
                    </div>
                  </button>
                ))}

                {/* Custom Model Option */}
                <button
                  onClick={() => handleModelSelect(localModel || '', true)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isCustomModel
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-neutral-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          isCustomModel ? 'text-blue-400' : 'text-white'
                        }`}>
                          Custom Model
                        </span>
                        {isCustomModel && <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium">Active</span>}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Enter a specific Gemini model ID</p>
                      
                      {isCustomModel && (
                        <div className="mt-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={localModel}
                            onChange={(e) => setLocalModel(e.target.value)}
                            placeholder="e.g. gemini-1.5-pro-latest"
                            className="w-full py-2 px-3 bg-neutral-950 border border-blue-500/30 rounded-lg text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-blue-500 transition-colors"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                    {!isCustomModel && (
                      <Plus className="w-5 h-5 text-neutral-400 shrink-0" />
                    )}
                    {isCustomModel && (
                      <Check className="w-5 h-5 text-blue-400 shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Status */}
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              isConfigured 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-neutral-900 border border-white/5'
            }`}>
              {isConfigured ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">API configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-500">Smart Suggest disabled (no API key)</span>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-neutral-950/50">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all btn-press"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Settings button component for easy use in header
export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConfigured } = useGeminiConfig();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all btn-press"
        title="Settings"
      >
        <Settings className="w-4 h-4 text-neutral-400" />
        {!isConfigured && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-neutral-950" />
        )}
      </button>
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
