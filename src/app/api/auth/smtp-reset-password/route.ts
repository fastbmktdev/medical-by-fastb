import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/database/supabase/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

/**
 * SMTP Reset Password API Endpoint
 * 
 * POST /api/auth/smtp-reset-password
 * 
 * Used as a fallback when Supabase hits rate limits
 * Sends password reset link via SMTP
 * 
 * Body:
 * {
 *   email: string
 * }
 */

/**
 * SMTP Configuration
 */
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@yourdomain.com',
};

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokenStore = new Map<string, { token: string; expiresAt: number }>();

// Reset token expires in 1 hour
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Create SMTP transporter
 */
function createTransporter() {
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    throw new Error('SMTP not configured');
  }

  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: SMTP_CONFIG.auth.user,
      pass: SMTP_CONFIG.auth.pass,
    },
  });
}

/**
 * Generate password reset email HTML
 */
function generateResetEmailHtml(data: { token: string; email: string }): string {
  const { token, email } = data;
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password?token=${token}&email=${encodeURIComponent(email)}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>รีเซ็ตรหัสผ่าน</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🥊 MUAYTHAI Platform</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">รีเซ็ตรหัสผ่าน</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">สวัสดี! 👋</h2>
          
          <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.8;">
              เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อสร้างรหัสผ่านใหม่:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                🔑 รีเซ็ตรหัสผ่าน
              </a>
            </div>
            
            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
              หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
              <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
              <strong>⚠️ คำเตือน:</strong> หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาทิ้งอีเมลนี้ไว้หรือแจ้งทีมงาน
            </p>
          </div>
          
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
              ⏰ ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              📅 วันที่ส่ง: ${new Date().toLocaleString('th-TH', { 
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
            ต้องการความช่วยเหลือ? ติดต่อเรา:
          </p>
          <p style="margin: 0;">
            <a href="mailto:support@muaythai.com" style="color: #dc2626; text-decoration: none; font-size: 14px;">
              support@muaythai.com
            </a>
          </p>
        </div>
      </body>
    </html>
  `;
}

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

    // Send password reset email via SMTP
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน - MUAYTHAI Platform 🥊',
      html: generateResetEmailHtml({ token: resetToken, email }),
    });

    console.log('✅ Password reset email sent via SMTP:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('❌ SMTP reset password error:', error);
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

