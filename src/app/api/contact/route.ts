/**
 * Contact Form API Endpoint
 * 
 * POST /api/contact
 * Handles contact form submissions and sends email via Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';

/**
 * Contact form request body
 */
interface ContactRequestBody {
  name: string;
  email: string;
  message: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate contact form data
 */
function validateContactData(data: ContactRequestBody): string | null {
  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
  }

  if (data.name.trim().length > 100) {
    return 'ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)';
  }

  // Validate email
  if (!data.email || !isValidEmail(data.email)) {
    return 'รูปแบบอีเมลไม่ถูกต้อง';
  }

  // Validate message
  if (!data.message || data.message.trim().length < 10) {
    return 'ข้อความต้องมีอย่างน้อย 10 ตัวอักษร';
  }

  if (data.message.trim().length > 5000) {
    return 'ข้อความยาวเกินไป (สูงสุด 5000 ตัวอักษร)';
  }

  return null;
}

/**
 * POST /api/contact
 * Send contact form email
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContactRequestBody = await request.json();

    // Validate data
    const validationError = validateContactData(body);
    if (validationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationError 
        },
        { status: 400 }
      );
    }

    // Sanitize data (trim whitespace)
    const sanitizedData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      message: body.message.trim(),
    };

    // Send email
    const result = await sendContactEmail(sanitizedData);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง' 
        },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json(
      {
        success: true,
        message: 'ส่งข้อความสำเร็จ! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in contact API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contact
 * Get email service status (for debugging)
 */
export async function GET() {
  const { isEmailServiceConfigured, getEmailServiceStatus } = await import('@/lib/email');
  
  return NextResponse.json({
    status: 'ok',
    emailService: isEmailServiceConfigured() ? 'configured' : 'not configured',
    config: getEmailServiceStatus(),
  });
}

