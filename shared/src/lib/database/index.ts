/**
 * Database Module - Barrel Export (Client-Side Safe)
 *
 * This barrel export ONLY includes client-side safe exports.
 * Server-side utilities are separated to prevent bundling issues.
 *
 * For server-side code, import from:
 * - '@shared/lib/database/supabase/server'
 * - '@shared/lib/database/supabase/middleware'
 */

// Browser/Client-side Supabase client
export { createBrowserClient, createClient } from './supabase/client';

// NOTE: Server-side exports are intentionally excluded from this barrel file
// to prevent Next.js from bundling server-only code (next/headers) into client bundles.
//
// For server-side code, use direct imports:
// import { createServerClient } from '@shared/lib/database/supabase/server';
// import { createAdminClient } from '@shared/lib/database/supabase/server';
// import { createClientForMiddleware } from '@shared/lib/database/supabase/server';
// import { updateSession } from '@shared/lib/database/supabase/middleware';
