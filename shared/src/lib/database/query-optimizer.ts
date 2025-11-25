/**
 * Database Query Optimizer
 * Utilities for optimizing database queries and managing connections
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Execute multiple queries in parallel
 * Useful for reducing N+1 query problems
 */
export async function executeParallelQueries<T extends Record<string, unknown>>(
  queries: Record<keyof T, Promise<{ data: unknown; error: unknown }>>
): Promise<{ data: Partial<T>; errors: Partial<Record<keyof T, Error>> }> {
  const keys = Object.keys(queries) as Array<keyof T>;
  const results = await Promise.allSettled(
    keys.map(key => queries[key])
  );

  const data: Partial<T> = {};
  const errors: Partial<Record<keyof T, Error>> = {};

  results.forEach((result, index) => {
    const key = keys[index];
    if (result.status === 'fulfilled') {
      const { data: queryData, error } = result.value;
      if (error) {
        errors[key] = error instanceof Error ? error : new Error(String(error));
      } else {
        data[key] = queryData as T[keyof T];
      }
    } else {
      errors[key] = result.reason instanceof Error 
        ? result.reason 
        : new Error(String(result.reason));
    }
  });

  return { data, errors };
}

/**
 * Batch multiple queries with error handling
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<{ data: T | null; error: unknown }>>,
  options?: {
    stopOnError?: boolean;
    fallbackValue?: T | null;
  }
): Promise<Array<{ data: T | null; error: Error | null }>> {
  const { stopOnError = false, fallbackValue = null } = options || {};

  if (stopOnError) {
    // Execute sequentially, stop on first error
    const results: Array<{ data: T | null; error: Error | null }> = [];
    for (const query of queries) {
      try {
        const result = await query();
        if (result.error) {
          results.push({
            data: fallbackValue,
            error: result.error instanceof Error 
              ? result.error 
              : new Error(String(result.error)),
          });
          break;
        }
        results.push({ data: result.data, error: null });
      } catch (error) {
        results.push({
          data: fallbackValue,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        break;
      }
    }
    return results;
  }

  // Execute in parallel
  const results = await Promise.allSettled(
    queries.map(query => query())
  );

  return results.map(result => {
    if (result.status === 'fulfilled') {
      const { data, error } = result.value;
      return {
        data: data ?? fallbackValue,
        error: error 
          ? (error instanceof Error ? error : new Error(String(error)))
          : null,
      };
    }
    return {
      data: fallbackValue,
      error: result.reason instanceof Error 
        ? result.reason 
        : new Error(String(result.reason)),
    };
  });
}

/**
 * Optimize select statement - only select needed columns
 */
export function optimizeSelect(
  columns: string[] | string | '*',
  defaultColumns?: string[]
): string {
  if (columns === '*') {
    return defaultColumns ? defaultColumns.join(', ') : '*';
  }
  if (Array.isArray(columns)) {
    return columns.join(', ');
  }
  return columns;
}

/**
 * Create optimized query builder with common optimizations
 */
export function createOptimizedQuery<T>(
  supabase: SupabaseClient,
  table: string
) {
  return {
    /**
     * Select only specified columns (optimized)
     */
    select: (columns: string[] | string = '*') => {
      const optimizedColumns = optimizeSelect(columns);
      return supabase.from(table).select(optimizedColumns);
    },

    /**
     * Select with join optimization
     */
    selectWithJoin: (
      columns: string[] | string,
      joins: Record<string, { table: string; columns: string[] }>
    ) => {
      let selectClause = Array.isArray(columns) ? columns.join(', ') : columns;
      
      // Add join columns
      Object.entries(joins).forEach(([alias, { table: joinTable, columns: joinColumns }]) => {
        const joinSelect = joinColumns.map(col => `${joinTable}:${alias}(${col})`).join(', ');
        selectClause += `, ${joinSelect}`;
      });

      return supabase.from(table).select(selectClause);
    },
  };
}

/**
 * Cache query results in memory (simple implementation)
 * For production, consider using Redis or similar
 */
class QueryCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly TTL: number;

  constructor(ttlMs: number = 60000) {
    this.TTL = ttlMs;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Export singleton instance
export const queryCache = new QueryCache(60000); // 1 minute default TTL

/**
 * Execute query with caching
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options?: { ttl?: number; skipCache?: boolean }
): Promise<{ data: T | null; error: unknown }> {
  const { ttl, skipCache = false } = options || {};

  if (!skipCache) {
    const cached = queryCache.get<T>(key);
    if (cached !== null) {
      return { data: cached, error: null };
    }
  }

  const result = await queryFn();
  
  if (!result.error && result.data !== null && !skipCache) {
    queryCache.set(key, result.data);
  }

  return result;
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    queryCache.clear();
    return;
  }

  // Simple pattern matching - for production, consider more sophisticated matching
  const keys = Array.from(queryCache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  });
}

