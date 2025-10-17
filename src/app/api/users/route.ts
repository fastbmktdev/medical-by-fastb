import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * API endpoint to list users (for testing/admin purposes)
 * GET /api/users
 * 
 * Returns list of registered users with their details
 * 
 * ⚠️ Warning: This is for development only!
 * In production, add authentication and authorization checks
 */
export async function GET() {
  try {
    // Get recent users from auth.users table
    const users = await sql`
      SELECT 
        id,
        email,
        created_at,
        email_confirmed_at,
        raw_user_meta_data->>'full_name' as full_name,
        last_sign_in_at,
        CASE 
          WHEN email_confirmed_at IS NULL THEN 'pending'
          ELSE 'confirmed'
        END as status
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Get user roles if table exists
    let usersWithRoles;
    try {
      usersWithRoles = await sql`
        SELECT 
          u.id,
          u.email,
          ur.role,
          u.raw_user_meta_data->>'full_name' as full_name,
          u.created_at,
          u.email_confirmed_at,
          CASE 
            WHEN u.email_confirmed_at IS NULL THEN 'pending'
            ELSE 'confirmed'
          END as status
        FROM auth.users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        ORDER BY u.created_at DESC
        LIMIT 20
      `;
    } catch (error) {
      // user_roles table might not exist yet
      usersWithRoles = users;
    }

    return NextResponse.json({
      success: true,
      count: usersWithRoles.length,
      users: usersWithRoles,
      message: '⚠️ This endpoint should be protected in production!',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        help: 'Make sure DATABASE_URL is configured correctly',
      },
      { status: 500 }
    );
  }
}

