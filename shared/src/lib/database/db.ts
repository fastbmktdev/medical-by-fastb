/**
 * Direct PostgreSQL Database Connection
 * 
 * This module provides a direct PostgreSQL connection using the `postgres` library.
 * Use this for advanced queries, migrations, or operations that require direct SQL access.
 * 
 * For most use cases, prefer using Supabase client instead:
 * - @shared/lib/database/supabase/client (client-side)
 * - @shared/lib/database/supabase/server (server-side)
 * 
 * Environment Variable Required:
 * - DATABASE_URL: PostgreSQL connection string
 * 
 * Supabase Production Connection String Format:
 * - Pooler (recommended): postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 * - Direct: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
 * 
 * @example
 * ```typescript
 * import sql from '@shared/lib/database/db';
 * 
 * const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
 * ```
 */

import postgres from 'postgres';

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please set DATABASE_URL in your .env.local file or environment variables.\n\n' +
    'For Supabase Production:\n' +
    '1. Go to Supabase Dashboard → Project Settings → Database\n' +
    '2. Find "Connection string" section\n' +
    '3. Copy the connection string (use "Pooler" mode for better performance)\n' +
    '4. Set DATABASE_URL in your environment variables'
  );
}

// Validate connection string format
if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
  throw new Error(
    'Invalid DATABASE_URL format. ' +
    'Connection string must start with "postgresql://" or "postgres://"'
  );
}

// Create postgres client with connection pooling
// Configuration optimized for Supabase production
const sql = postgres(connectionString, {
  // Connection pool settings
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  
  // Supabase-specific optimizations
  prepare: true, // Use prepared statements for better performance
  
  // Error handling
  onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
  
  // Transform settings
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
  
  // SSL configuration (required for Supabase production)
  ssl: connectionString.includes('supabase.co') ? 'require' : false,
});

// Handle connection errors gracefully
sql.listen('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

// Log connection status in development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ PostgreSQL connection initialized');
  console.log(`📊 Connection string: ${connectionString.replace(/:[^:@]+@/, ':****@')}`); // Hide password
}

export default sql;

