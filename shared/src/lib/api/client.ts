/**
 * API Client Utilities
 * Centralized API client with caching, request deduplication, and error handling
 */

type RequestCache = Map<string, { data: unknown; timestamp: number; promise?: Promise<unknown> }>;

class ApiClient {
  private cache: RequestCache = new Map();
  private pendingRequests: Map<string, Promise<Response>> = new Map();
  private readonly defaultCacheTTL: number = 60000; // 1 minute
  private readonly maxCacheSize: number = 100;

  /**
   * Get cached data if available and not expired
   */
  private getCached<T>(key: string, ttl?: number): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const cacheTTL = ttl || this.defaultCacheTTL;

    if (age > cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache data
   */
  private setCache<T>(key: string, data: T): void {
    // Implement LRU cache eviction if cache is too large
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Clear cache for a specific pattern or all cache
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Fetch with request deduplication and caching
   */
  async fetch<T>(
    url: string,
    options?: Omit<RequestInit, 'cache'> & {
      cache?: boolean;
      cacheTTL?: number;
      skipCache?: boolean;
    }
  ): Promise<{ data: T; response: Response }> {
    const {
      cache = true,
      cacheTTL,
      skipCache = false,
      ...fetchOptions
    } = options || {};

    const method = fetchOptions.method || 'GET';
    const isGetRequest = method === 'GET';

    // For GET requests, check cache first
    if (isGetRequest && cache && !skipCache) {
      const cacheKey = this.getCacheKey(url, fetchOptions);
      const cached = this.getCached<T>(cacheKey, cacheTTL);
      if (cached !== null) {
        // Return a mock response for cached data
        return {
          data: cached,
          response: new Response(JSON.stringify({ success: true, data: cached }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        };
      }
    }

    // Check for pending request (deduplication)
    const requestKey = this.getCacheKey(url, fetchOptions);
    const pendingRequest = this.pendingRequests.get(requestKey);

    if (pendingRequest) {
      const response = await pendingRequest;
      const result = await response.json();
      return {
        data: result.data || result as T,
        response,
      };
    }

    // Create new request
    const requestPromise = fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
    } as RequestInit).then(async (response) => {
      // Remove from pending requests
      this.pendingRequests.delete(requestKey);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (isGetRequest && cache && !skipCache && response.ok) {
        const cacheKey = this.getCacheKey(url, fetchOptions);
        this.setCache(cacheKey, data.data || data);
      }

      return response;
    }).catch((error) => {
      // Remove from pending requests on error
      this.pendingRequests.delete(requestKey);
      throw error;
    });

    this.pendingRequests.set(requestKey, requestPromise);

    const response = await requestPromise;
    const result = await response.json();

    return {
      data: result.data || result as T,
      response,
    };
  }

  /**
   * Batch multiple API requests
   */
  async batch<T extends Record<string, string>>(
    requests: Record<keyof T, { url: string; options?: Omit<RequestInit, 'cache'> & { cache?: boolean; cacheTTL?: number; skipCache?: boolean } }>
  ): Promise<Record<keyof T, unknown>> {
    const keys = Object.keys(requests) as Array<keyof T>;
    const promises = keys.map(key => {
      const { url, options } = requests[key];
      return this.fetch(url, options).then(result => ({ key, data: result.data }));
    });

    const results = await Promise.all(promises);
    const data = {} as Record<keyof T, unknown>;

    results.forEach(({ key, data: resultData }) => {
      data[key] = resultData;
    });

    return data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Convenience function for GET requests
 */
export async function apiGet<T>(
  url: string,
  options?: { cache?: boolean; cacheTTL?: number; skipCache?: boolean }
): Promise<T> {
  const { data } = await apiClient.fetch<T>(url, {
    method: 'GET',
    ...options,
  });
  return data;
}

/**
 * Convenience function for POST requests
 */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  options?: Omit<RequestInit, 'method' | 'body' | 'cache'> & { cache?: boolean; cacheTTL?: number; skipCache?: boolean }
): Promise<T> {
  const { data } = await apiClient.fetch<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
  return data;
}

/**
 * Convenience function for PUT requests
 */
export async function apiPut<T>(
  url: string,
  body?: unknown,
  options?: Omit<RequestInit, 'method' | 'body' | 'cache'> & { cache?: boolean; cacheTTL?: number; skipCache?: boolean }
): Promise<T> {
  const { data } = await apiClient.fetch<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
  return data;
}

/**
 * Convenience function for DELETE requests
 */
export async function apiDelete<T>(
  url: string,
  options?: Omit<RequestInit, 'method' | 'cache'> & { cache?: boolean; cacheTTL?: number; skipCache?: boolean }
): Promise<T> {
  const { data } = await apiClient.fetch<T>(url, {
    method: 'DELETE',
    ...options,
  });
  return data;
}


