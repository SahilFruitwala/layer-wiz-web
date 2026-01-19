'use client';

import { GeminiProvider } from '@/contexts/GeminiContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GeminiProvider>
      {children}
    </GeminiProvider>
  );
}
