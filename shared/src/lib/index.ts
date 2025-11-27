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
export {
  // Browser/client-side client
  createBrowserClient,
  createClient, // Deprecated alias for backward compatibility
  
  // Server-side clients
  createServerClient,
  createAdminClient,
  createClientForMiddleware,
  
  // Middleware utilities
  updateSession,
  
  // Direct SQL connection
  sql,
  
  // Connection pool utilities
  getRequestClient,
} from './database';

// ============================================================================
// Authentication Utilities
// ============================================================================
export * from './auth/client';
export * from './auth/server';
export * from './auth';

// ============================================================================
// API & Route Utilities
// ============================================================================
export * from './api';

// ============================================================================
// Constants
// ============================================================================
export * from './constants';
export * from './constants/affiliate';
export * from './constants/files';
export * from './constants/forms';
export * from './constants/validation';

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

