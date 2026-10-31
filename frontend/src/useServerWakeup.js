import { useEffect, useState } from 'react';
import { API_BASE } from './api.js';

const HEALTH_URL = `${API_BASE}/health`;

/**
 * Pings the Render backend health endpoint immediately on mount.
 * Render free-tier instances spin down after 15 min of inactivity.
 * Retries every 3 s (up to 20 times = 60 s max).
 * Returns: 'waking' | 'ready' | 'error'
 */
export function useServerWakeup() {
  const [status, setStatus] = useState('waking');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    async function ping() {
      if (cancelled) return;
      try {
        const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          if (!cancelled) setStatus('ready');
          return;
        }
      } catch {
        // keep retrying
      }
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        if (!cancelled) setStatus('error');
        return;
      }
      setTimeout(ping, 3000);
    }

    ping();
    return () => { cancelled = true; };
  }, []);

  return status;
}
