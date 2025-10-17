import { NextResponse } from 'next/server';
import sql, { checkDatabaseHealth } from '@/lib/db';

/**
 * Database Connection Test API Route
 * 
 * This endpoint tests the direct PostgreSQL connection
 * and provides useful debugging information.
 * 
 * GET /api/db-test
 * 
 * Returns:
 * - Connection status
 * - Current timestamp from database
 * - Database version
 * - Health check result
 */
export async function GET() {
  try {
    // Check database health
    const isHealthy = await checkDatabaseHealth();

    if (!isHealthy) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database health check failed',
          connected: false,
        },
        { status: 503 }
      );
    }

    // Get current timestamp from database
    const [timeResult] = await sql`SELECT NOW() as current_time`;

    // Get database version
    const [versionResult] = await sql`SELECT version() as db_version`;

    // Count tables (example query)
    const tableCount = await sql`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    // Check for specific required tables
    const requiredTables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('user_roles', 'gyms', 'profiles')
      ORDER BY table_name
    `;

    const existingTableNames = requiredTables.map((row: { tableName: string }) => row.tableName);
    const missingTables = ['user_roles', 'gyms', 'profiles'].filter(
      table => !existingTableNames.includes(table)
    );

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      connected: true,
      data: {
        timestamp: timeResult.currentTime,
        version: versionResult.dbVersion,
        publicTablesCount: tableCount[0].tableCount,
      },
      tables: {
        existing: existingTableNames,
        missing: missingTables,
        needsMigration: missingTables.length > 0,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
      ...(missingTables.length > 0 && {
        warning: 'Some required tables are missing. Run migrations to create them.',
        instructions: 'See MIGRATION_GUIDE.md for instructions on running migrations.',
      }),
    });
  } catch (error) {
    console.error('Database test error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        connected: false,
        help: {
          message: 'Check your DATABASE_URL environment variable',
          expectedFormat: 'postgresql://user:password@host:port/database',
          documentation: '/DATABASE_SETUP.md',
        },
      },
      { status: 500 }
    );
  }
}

