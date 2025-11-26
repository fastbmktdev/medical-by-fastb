import { NextRequest, NextResponse } from 'next/server';
import { createClientForMiddleware } from '@shared/lib/database/supabase/server';

/**
 * Create User API Endpoint
 * 
 * POST /api/users/create
 * 
 * Body:
 * {
 *   email: string,
 *   password: string,
 *   full_name?: string,
 *   username?: string,
 *   phone?: string,
 *   role?: 'authenticated' | 'partner' | 'admin',
 *   avatar_url?: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body as any).email as string;
    const password = (body as any).password as string;
    const full_name = (body as any).full_name as string | undefined;
    const username = (body as any).username as string | undefined;
    const phone = (body as any).phone as string | undefined;
    const role = ((body as any).role as string) || 'authenticated';
    const avatar_url = (body as any).avatar_url as string | undefined;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 6 characters long' 
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['authenticated', 'partner', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid role. Must be authenticated, partner, or admin' 
        },
        { status: 400 }
      );
    }

    // Validate username format if provided
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username can only contain letters, numbers, underscores, and hyphens' 
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const { supabase } = createClientForMiddleware(request);

    // Check if user already exists by listing users and filtering by email
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find((u: any) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Check if username is taken (if provided)
    if (username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Username is already taken' 
          },
          { status: 409 }
        );
      }
    }

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        username: username || '',
        phone: phone || '',
        avatar_url: avatar_url || ''
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create user in authentication system' 
        },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username,
        full_name,
        phone,
        avatar_url
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Continue even if profile creation fails
    }

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role
      });

    if (roleError) {
      console.error('Role error:', roleError);
      // Continue even if role creation fails
    }

    // Initialize user points for gamification
    const { error: pointsError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: 0,
        current_level: 1,
        points_to_next_level: 100
      });

    if (pointsError) {
      console.error('Points error:', pointsError);
      // Continue even if points initialization fails
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        email,
        username,
        full_name,
        role,
        message: 'User created successfully'
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get User Details API Endpoint
 * 
 * GET /api/users/create?email=user@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email parameter is required' 
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const { supabase } = createClientForMiddleware(request);

    // Get user details by listing users and filtering by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const userData = users?.find((u: any) => u.email === email);
    
    if (userError || !userData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get role data
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        email: userData.email,
        username: profile?.username,
        full_name: profile?.full_name,
        phone: profile?.phone,
        role: roleData?.role,
        avatar_url: profile?.avatar_url,
        created_at: userData.created_at,
        last_sign_in_at: userData.last_sign_in_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
