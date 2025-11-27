// Database Utilities Barrel Export
export { createClient } from './supabase/client';
export { createClient as createServerClient } from './supabase/server';

// Direct PostgreSQL connection (optional - requires DATABASE_URL)
// Use this for advanced queries or direct SQL operations
export { default as sql } from './db';
export { updateSession } from './supabase/middleware';
