'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GeminiConfig {
  apiKey: string;
  model: string;
}

interface GeminiContextType {
  config: GeminiConfig;
  setConfig: (config: GeminiConfig) => void;
  isConfigured: boolean;
}

const defaultConfig: GeminiConfig = {
  apiKey: '',
  model: 'gemini-2.5-flash',
};

const STORAGE_KEY = 'layerwiz-gemini-config';

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export function GeminiProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<GeminiConfig>(defaultConfig);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfigState({
          apiKey: parsed.apiKey || '',
          model: parsed.model || defaultConfig.model,
        });
      }
    } catch (e) {
      console.error('Failed to load Gemini config:', e);
    }
    setIsHydrated(true);
  }, []);

  const setConfig = (newConfig: GeminiConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save Gemini config:', e);
    }
  };

  const isConfigured = isHydrated && config.apiKey.length > 0;

  return (
    <GeminiContext.Provider value={{ config, setConfig, isConfigured }}>
      {children}
    </GeminiContext.Provider>
  );
}

export function useGeminiConfig() {
  const context = useContext(GeminiContext);
  if (context === undefined) {
    throw new Error('useGeminiConfig must be used within a GeminiProvider');
  }
  return context;
}

// Available models for IMAGE ANALYSIS (multimodal input → text output)
// These models can analyze images and provide text suggestions
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Best price-performance. Fast, accurate image analysis.',
    recommended: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'Fastest & cheapest. Good for simple image analysis.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable. Best for complex, detailed analysis.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Previous generation. Reliable and well-tested.',
  },
];

// Available models for IMAGE GENERATION (text → image output)
// Used for AI background generation feature
export const IMAGE_GENERATION_MODELS = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    description: 'Native image generation. High quality results.',
    recommended: true,
  },
  {
    id: 'imagen-4.0-fast-generate-001',
    name: 'Imagen 4.0 Fast',
    description: 'Google Imagen model. Fast generation.',
  },
];
