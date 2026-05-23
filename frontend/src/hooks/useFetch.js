import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useFetch — Generic data-fetching hook with loading, error, and data state.
 * Automatically attaches the JWT auth token from AuthContext.
 *
 * @param {string|null} url    — API endpoint (null = skip fetch)
 * @param {object}      opts   — Additional fetch options
 *
 * Returns:
 *   data      T | null
 *   isLoading boolean
 *   error     string | null
 *   refetch   () => void
 */
export function useFetch(url, opts = {}) {
  const { token }           = useAuth();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState(null);
  const abortRef            = useRef(null);

  const execute = useCallback(async () => {
    if (!url) return;

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const targetUrl = url.startsWith('/api') ? url : `/api${url}`;
      const res = await fetch(targetUrl, {
        ...opts,
        signal: abortRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opts.headers || {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [url, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
    return () => abortRef.current?.abort();
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}
