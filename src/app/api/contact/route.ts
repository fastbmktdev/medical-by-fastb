/**
 * Contact Form API Endpoint
 * 
 * POST /api/contact
 * Handles contact form submissions and sends email via Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';
import { 
  ValidationError, 
  errorResponse, 
  successResponse,
  withErrorHandler 
} from '@/lib/api/error-handler';

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
function validateContactData(data: ContactRequestBody): void {
  const errors: Record<string, string[]> = {};

  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    errors.name = ['ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'];
  } else if (data.name.trim().length > 100) {
    errors.name = ['ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)'];
  }

  // Validate email
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = ['รูปแบบอีเมลไม่ถูกต้อง'];
  }

  // Validate message
  if (!data.message || data.message.trim().length < 10) {
    errors.message = ['ข้อความต้องมีอย่างน้อย 10 ตัวอักษร'];
  } else if (data.message.trim().length > 5000) {
    errors.message = ['ข้อความยาวเกินไป (สูงสุด 5000 ตัวอักษร)'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('ข้อมูลที่ส่งมาไม่ถูกต้อง', errors);
  }
}

/**
 * POST /api/contact
 * Send contact form email
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  let body: ContactRequestBody;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('รูปแบบข้อมูลไม่ถูกต้อง');
  }

  // Validate data
  validateContactData(body);

  // Sanitize data (trim whitespace)
  const sanitizedData = {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    message: body.message.trim(),
  };

  // Send email
  const result = await sendContactEmail(sanitizedData);

  if (!result.success) {
    throw new Error(result.error || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง');
  }

  // Success
  return successResponse(
    { message: 'ส่งข้อความสำเร็จ! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง' },
    200
  );
});

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

