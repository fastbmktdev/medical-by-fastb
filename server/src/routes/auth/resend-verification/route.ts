import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@shared/lib/database/supabase/server';
import { sendVerificationEmail } from '@shared/lib/email/resend';

/**
 * Resend Email Verification OTP API Endpoint
 * 
 * POST /api/auth/resend-verification
 * 
 * Used as a fallback when Supabase hits rate limits
 * Sends verification email via Resend with OTP code
 * 
 * Body:
 * {
 *   email: string,
 *   fullName?: string
 * }
 */

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// OTP expires in 10 minutes
const OTP_EXPIRY = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY,
    });

    // Send verification email via Resend
    const emailResult = await sendVerificationEmail({
      to: email,
      otp,
      fullName: fullName || 'คุณ',
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send verification email. Please try again later.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Verify OTP API Endpoint
 * 
 * POST /api/auth/verify-otp
 * 
 * Verifies the OTP sent via Resend email
 * Creates the user account if OTP is valid
 * 
 * Body:
 * {
 *   email: string,
 *   otp: string,
 *   username: string,
 *   fullName: string,
 *   phone: string,
 *   password: string
 * }
 */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, username, fullName, phone, password } = body;

    // Validate required fields
    if (!email || !otp || !username || !fullName || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    // Verify OTP
    const storedOtp = otpStore.get(email);
    if (!storedOtp) {
      return NextResponse.json(
        {
          success: false,
          error: 'OTP not found or expired',
        },
        { status: 400 }
      );
    }

    // Check expiry
    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json(
        {
          success: false,
          error: 'OTP has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid OTP',
        },
        { status: 400 }
      );
    }

    // OTP verified, now create the user
    const supabase = createAdminClient();

    // Check if username already exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username);

    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username already exists',
        },
        { status: 409 }
      );
    }

    // Check if email already exists
    const { data: { users }, error: userListError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === email);
    
    if (userListError) {
      console.error('Error listing users:', userListError);
    }
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered',
        },
        { status: 409 }
      );
    }

    // Create user with email confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
        phone,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user',
        },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      username,
      full_name: fullName,
      phone,
    });

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Create user role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'authenticated',
    });

    if (roleError) {
      console.error('Role error:', roleError);
    }

    // Initialize user points for gamification
    const { error: pointsError } = await supabase.from('user_points').insert({
      user_id: userId,
      total_points: 0,
      current_level: 1,
      points_to_next_level: 100,
    });

    if (pointsError) {
      console.error('Points error:', pointsError);
    }

    // Clean up OTP
    otpStore.delete(email);

    return NextResponse.json({
      success: true,
      data: {
        user: authData.user,
        message: 'Account created successfully',
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

