'use client';

import { useEffect } from 'react';

export function ChunkErrorRecovery() {
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      const errorMsg = event.message || event.error?.message || '';
      if (/ChunkLoadError|Loading chunk|Failed to load resource/i.test(errorMsg)) {
        const lastReload = sessionStorage.getItem('chunk_error_reload_time');
        const now = Date.now();
        // Prevent infinite loop by ensuring reload only happens once per 10 seconds
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('chunk_error_reload_time', String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleUnhandledError);
    return () => window.removeEventListener('error', handleUnhandledError);
  }, []);

  return null;
}
