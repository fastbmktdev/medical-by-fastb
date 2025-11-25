/**
 * Service Utilities
 * 
 * Shared utilities for service layer to reduce code duplication
 * and improve consistency across services.
 */

import { createClient } from '@shared/lib/database/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase client for service operations
 * Can accept an existing client to support transactions or reuse
 */
export async function getServiceClient(
  existingClient?: SupabaseClient
): Promise<SupabaseClient> {
  if (existingClient) {
    return existingClient;
  }
  return await createClient();
}

/**
 * Service error class for better error handling
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Validation error for service layer
 */
export class ServiceValidationError extends ServiceError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ServiceValidationError';
  }
}

/**
 * Not found error for service layer
 */
export class ServiceNotFoundError extends ServiceError {
  constructor(message: string = 'ไม่พบข้อมูลที่ต้องการ') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'ServiceNotFoundError';
  }
}

/**
 * Handle Supabase query result with standardized error handling
 */
export function handleQueryResult<T>(
  data: T | null,
  error: unknown,
  notFoundMessage: string = 'ไม่พบข้อมูลที่ต้องการ'
): T {
  if (error) {
    throw new ServiceError(
      error instanceof Error ? error.message : 'Database query failed',
      'QUERY_ERROR',
      500,
      error
    );
  }

  if (!data) {
    throw new ServiceNotFoundError(notFoundMessage);
  }

  return data;
}

/**
 * Validate required fields
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  fields: Array<keyof T>
): void {
  const missing: string[] = [];

  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(String(field));
    }
  }

  if (missing.length > 0) {
    throw new ServiceValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing: missing }
    );
  }
}

/**
 * Handle Supabase query error (throw ServiceError if error exists)
 * @param error - Query error
 * @param message - Custom error message
 */
export function handleQueryError(error: unknown, message: string = 'Database query failed'): void {
  if (error) {
    throw new ServiceError(
      error instanceof Error ? error.message : message,
      'QUERY_ERROR',
      500,
      error
    );
  }
}

/**
 * Check if query result has error or no data
 * @param data - Query data
 * @param error - Query error
 * @param notFoundMessage - Message if not found
 * @returns true if has error or no data
 */
export function hasQueryError<T>(data: T | null, error: unknown, notFoundMessage?: string): error is Error {
  if (error) {
    return true;
  }
  if (!data && notFoundMessage) {
    throw new ServiceNotFoundError(notFoundMessage);
  }
  return false;
}

