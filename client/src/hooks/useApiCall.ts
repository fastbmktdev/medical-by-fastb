/**
 * React hook for API calls with automatic caching and loading states
 * Client-side only hook that uses the shared API client
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@shared/lib/api/client';

export function useApiCall<T>(
  url: string | null,
  options?: {
    enabled?: boolean;
    cache?: boolean;
    cacheTTL?: number;
    skipCache?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { enabled = true, ...fetchOptions } = options || {};

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.fetch<T>(url, {
        method: 'GET',
        cache: fetchOptions.cache,
        cacheTTL: fetchOptions.cacheTTL,
        skipCache: fetchOptions.skipCache,
      });
      setData(result.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled, fetchOptions.cache, fetchOptions.cacheTTL, fetchOptions.skipCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

