'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { API_BASE } from '@/lib/config';
import { AuthProvider, authHeaders, clearAuth } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SWRConfig
        value={{
          fetcher: (url: string) => {
            // Prepend API_BASE for relative /api/ keys
            const fullUrl = url.startsWith('/') ? `${API_BASE}${url.replace(/^\/api/, '')}` : url;
            return fetch(fullUrl, { headers: { ...authHeaders() } }).then((r) => {
              if (r.status === 401) {
                clearAuth();
                if (typeof window !== 'undefined') window.location.href = '/login';
                throw new Error('Session expired');
              }
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
    </AuthProvider>
  );
}
