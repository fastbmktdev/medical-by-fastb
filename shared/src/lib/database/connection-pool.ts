/**
 * Database Connection Pool Utilities
 * 
 * Note: Supabase client already handles connection pooling internally.
 * This module provides utilities for optimizing client reuse and managing
 * connection patterns in Next.js server components.
 * 
 * IMPORTANT: In Next.js App Router, each request should get a fresh client
 * to ensure proper cookie handling and session management. The functions here
 * are primarily for documentation and potential future optimizations.
 */

import { createServerClient } from './supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get a Supabase client for the current request
 * 
 * In Next.js App Router, each request should get a fresh client
 * to ensure proper cookie handling and session management.
 * 
 * @returns Promise resolving to a Supabase client instance
 */
export async function getRequestClient(): Promise<SupabaseClient> {
  // Always create a new client per request for proper session handling
  return await createServerClient();
}

/**
 * Execute a function with a Supabase client
 * Ensures proper client lifecycle management
 */
export async function withClient<T>(
  fn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await createServerClient();
  try {
    return await fn(client);
  } finally {
    // Client cleanup is handled by Supabase internally
    // This is just for potential future cleanup logic
  }
}

/**
 * Batch multiple operations with a single client
 * Useful for reducing client creation overhead
 */
export async function batchWithClient<T>(
  operations: Array<(client: SupabaseClient) => Promise<T>>
): Promise<T[]> {
  const client = await createServerClient();
  try {
    return await Promise.all(operations.map(op => op(client)));
  } finally {
    // Client cleanup handled internally
  }
}

