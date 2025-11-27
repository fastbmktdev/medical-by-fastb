/**
 * Shared Library - Main Barrel Export
 * 
 * This module provides centralized exports for all shared library functionality.
 * Organized by domain/concern for better maintainability and discoverability.
 * 
 * @module @shared/lib
 */

// ============================================================================
// Database & Supabase Clients
// ============================================================================
// Browser/client-side client
export {
  createBrowserClient,
  createClient, // Deprecated alias for backward compatibility
} from './database';

// Server-side clients (imported directly to avoid bundling issues)
export {
  createServerClient,
  createAdminClient,
  createClientForMiddleware,
} from './database/supabase/server';

// Middleware utilities
export { updateSession } from './database/supabase/middleware';

// Direct SQL connection
export { default as sql } from './database/db';

// Connection pool utilities
export { getRequestClient } from './database/connection-pool';

// ============================================================================
// Authentication Utilities
// ============================================================================
// Client-side auth utilities (default exports)
// Note: Server-side auth utilities should be imported directly from './auth/server'
// to avoid conflicts with client-side exports
export * from './auth/client';

// ============================================================================
// API & Route Utilities
// ============================================================================
export * from './api';

// ============================================================================
// Constants
// ============================================================================
export * from './constants';

// ============================================================================
// Email Services
// ============================================================================
export * from './email';

// ============================================================================
// Hooks
// ============================================================================
export * from './hooks';

// ============================================================================
// Icons
// ============================================================================
export * from './icons';

// ============================================================================
// Impersonation
// ============================================================================
export * from './impersonation';

// ============================================================================
// Middleware Utilities
// ============================================================================
export * from './middleware/csrf-protection';
export * from './middleware/rate-limit';
export * from './middleware/rate-limit-utils';

// ============================================================================
// Payment Utilities
// ============================================================================
export * from './payments';

// ============================================================================
// General Utilities
// ============================================================================
export * from './utils';

