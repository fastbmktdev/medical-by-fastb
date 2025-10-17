import postgres from 'postgres';

/**
 * Direct PostgreSQL connection using postgres.js
 * 
 * This provides direct database access for server-side operations,
 * complementing the Supabase client for authentication and storage.
 * 
 * Use this for:
 * - Server-side API routes
 * - Complex database queries
 * - Batch operations
 * - Direct SQL queries
 * 
 * Note: This bypasses Supabase Row Level Security (RLS).
 * Use Supabase client for operations that need RLS enforcement.
 */

// Get database connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please add it to your .env.local file. ' +
    'You can find it in Supabase Dashboard → Settings → Database → Connection string (URI)'
  );
}

/**
 * PostgreSQL client instance
 * Configured with connection pooling and automatic type parsing
 */
const sql = postgres(connectionString, {
  // Connection pool configuration
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  
  // Transform column names from snake_case to camelCase (optional)
  transform: {
    column: {
      to: postgres.toCamel,
      from: postgres.fromCamel,
    },
  },
  
  // SSL configuration (required for production Supabase)
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  
  // Error handling
  onnotice: () => {}, // Suppress notices in production
});

/**
 * Export the SQL template tag for queries
 * 
 * @example
 * // Simple query
 * const users = await sql`SELECT * FROM users WHERE email = ${email}`;
 * 
 * @example
 * // Insert with returning
 * const [newUser] = await sql`
 *   INSERT INTO users (email, name)
 *   VALUES (${email}, ${name})
 *   RETURNING *
 * `;
 * 
 * @example
 * // Transaction
 * const result = await sql.begin(async sql => {
 *   await sql`INSERT INTO logs (message) VALUES ('start')`;
 *   await sql`UPDATE users SET status = 'active' WHERE id = ${userId}`;
 *   return sql`INSERT INTO logs (message) VALUES ('complete')`;
 * });
 */
export default sql;

/**
 * Helper function to safely close the database connection
 * Call this when shutting down the application
 * 
 * @example
 * // In your shutdown handler
 * process.on('SIGTERM', async () => {
 *   await closeDatabase();
 *   process.exit(0);
 * });
 */
export async function closeDatabase(): Promise<void> {
  await sql.end({ timeout: 5 });
}

/**
 * Health check function to verify database connectivity
 * Useful for API health endpoints
 * 
 * @returns Promise that resolves to true if database is accessible
 * 
 * @example
 * // In an API route
 * export async function GET() {
 *   const isHealthy = await checkDatabaseHealth();
 *   return Response.json({ database: isHealthy ? 'healthy' : 'unhealthy' });
 * }
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

