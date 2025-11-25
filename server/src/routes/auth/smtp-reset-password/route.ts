import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@shared/lib/database/supabase/server';
import { sendPasswordResetEmail } from '@shared/lib/email/resend';
import crypto from 'crypto';

/**
 * Password Reset API Endpoint
 * 
 * POST /api/auth/smtp-reset-password
 * 
 * Used as a fallback when Supabase hits rate limits
 * Sends password reset link via Resend
 * 
 * Body:
 * {
 *   email: string
 * }
 */

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokenStore = new Map<string, { token: string; expiresAt: number }>();

// Reset token expires in 1 hour
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

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

    // Check if user exists
    const supabase = createAdminClient();
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === email);

    if (usersError || !existingUser) {
      // Don't reveal if user exists or not (security best practice)
      // Just return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store token with expiry
    resetTokenStore.set(email, {
      token: resetToken,
      expiresAt: Date.now() + RESET_TOKEN_EXPIRY,
    });

    // Send password reset email via Resend
    const emailResult = await sendPasswordResetEmail({
      to: email,
      token: resetToken,
      email,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send password reset email. Please try again later.',
        },
        { status: 500 }
      );
    }

    console.log('✅ Password reset email sent via Resend:', emailResult.id);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send password reset email. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * Verify reset token API
 * 
 * POST /api/auth/verify-reset-token
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    // Validate input
    if (!email || !token || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters',
        },
        { status: 400 }
      );
    }

    // Verify token
    const storedToken = resetTokenStore.get(email);
    if (!storedToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    // Check expiry
    if (Date.now() > storedToken.expiresAt) {
      resetTokenStore.delete(email);
      return NextResponse.json(
        {
          success: false,
          error: 'Reset token has expired',
        },
        { status: 400 }
      );
    }

    // Verify token
    if (storedToken.token !== token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid reset token',
        },
        { status: 400 }
      );
    }

    // Update password using Supabase admin
    const supabase = createAdminClient();
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update password',
        },
        { status: 500 }
      );
    }

    // Clean up token
    resetTokenStore.delete(email);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('❌ Verify reset token error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

