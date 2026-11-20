'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { API_BASE } from '@/lib/config';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => {
          // Prepend API_BASE for relative /api/ keys
          const fullUrl = url.startsWith('/') ? `${API_BASE}${url.replace(/^\/api/, '')}` : url;
          return fetch(fullUrl).then((r) => {
            if (!r.ok) throw new Error(`API ${r.status}`);
            return r.json();
          });
        },
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
