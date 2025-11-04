/**
 * Email Service using Resend
 * 
 * This service is for sending custom emails like:
 * - Contact form submissions
 * - Custom notifications
 * - Marketing emails
 * - Booking confirmations and reminders
 * - Payment receipts and failures
 * - Partner approval/rejection
 * - Admin alerts
 * 
 * Note: Auth emails (signup, reset password) are handled by Supabase SMTP
 */

import { Resend } from 'resend';
import {
  generateBookingConfirmationHtml,
  generateBookingReminderHtml,
  generatePaymentReceiptHtml,
  generatePaymentFailedHtml,
  generatePartnerApprovalHtml,
  generatePartnerRejectionHtml,
  generateAdminAlertHtml,
} from './templates';

// Initialize Resend client
// Will gracefully handle missing API key to prevent errors
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev',
  to: process.env.CONTACT_EMAIL_TO || 'admin@yourdomain.com',
};

/**
 * Contact Form Email Data
 */
export interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

/**
 * Send contact form email
 * 
 * @param data - Contact form data
 * @returns Promise with success status and message
 */
export async function sendContactEmail(data: ContactEmailData) {
  // Check if Resend is configured
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return {
      success: false,
      error: 'Email service not configured. Please contact administrator.',
    };
  }

  try {
    const { name, email, message } = data;

    // Send email
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      replyTo: email,
      subject: `ข้อความติดต่อจาก ${name}`,
      html: generateContactEmailHtml(data),
    });

    if (result.error) {
      console.error('❌ Failed to send email:', result.error);
      return {
        success: false,
        error: 'Failed to send email. Please try again later.',
      };
    }

    console.log('✅ Email sent successfully:', result.data?.id);
    return {
      success: true,
      message: 'Email sent successfully',
      id: result.data?.id,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: 'An error occurred while sending email.',
    };
  }
}

/**
 * Generate HTML for contact email
 */
function generateContactEmailHtml(data: ContactEmailData): string {
  const { name, email, message } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ข้อความติดต่อใหม่</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🥊 MUAYTHAI Platform</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">ข้อความติดต่อใหม่</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-top: 0;">ข้อมูลผู้ติดต่อ</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <p style="margin: 0 0 10px 0;">
              <strong style="color: #374151;">ชื่อ:</strong><br>
              <span style="color: #1f2937; font-size: 16px;">${name}</span>
            </p>
            
            <p style="margin: 0;">
              <strong style="color: #374151;">อีเมล:</strong><br>
              <a href="mailto:${email}" style="color: #dc2626; text-decoration: none; font-size: 16px;">${email}</a>
            </p>
          </div>
          
          <h3 style="color: #374151; margin-bottom: 10px;">ข้อความ:</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; white-space: pre-wrap; color: #1f2937;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              📅 วันที่: ${new Date().toLocaleString('th-TH', { 
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="mailto:${email}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              ตอบกลับทางอีเมล
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Email sent automatically from MUAYTHAI Platform Contact Form
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send welcome email (example for future use)
 * 
 * @param to - Recipient email
 * @param name - Recipient name
 */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'ยินดีต้อนรับสู่ MUAYTHAI Platform! 🥊',
      html: `
        <h2>สวัสดี ${name}!</h2>
        <p>ยินดีต้อนรับสู่ MUAYTHAI Platform</p>
        <p>เราดีใจที่คุณมาร่วมเป็นส่วนหนึ่งของชุมชนมวยไทย</p>
        <p>เริ่มต้นสำรวจ:</p>
        <ul>
          <li>ค้นหาค่ายมวยใกล้คุณ</li>
          <li>เรียนรู้เทคนิคมวยไทย</li>
          <li>ติดตามอีเว้นท์และการแข่งขัน</li>
        </ul>
      `,
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Verification Email Data
 */
export interface VerificationEmailData {
  to: string;
  otp: string;
  fullName?: string;
}

/**
 * Send verification email with OTP
 * Used as fallback when Supabase hits rate limits
 */
export async function sendVerificationEmail(data: VerificationEmailData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { to, otp, fullName = 'คุณ' } = data;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'ยืนยันการสมัครสมาชิก - MUAYTHAI Platform 🥊',
      html: generateVerificationEmailHtml({ otp, fullName }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Generate HTML for verification email
 */
function generateVerificationEmailHtml(data: { otp: string; fullName: string }): string {
  const { otp, fullName } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ยืนยันการสมัครสมาชิก</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🥊 MUAYTHAI Platform</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">ยืนยันการสมัครสมาชิก</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">สวัสดี ${fullName}! 🎉</h2>
          
          <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.8;">
              ขอบคุณที่สมัครสมาชิกกับเรา! กรุณายืนยันการสมัครสมาชิกโดยใช้รหัส OTP ด้านล่าง:
            </p>
            
            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px dashed #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                รหัสยืนยันของคุณ
              </p>
              <p style="margin: 0; color: #7f1d1d; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
            </div>
            
            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
              ⏰ รหัสนี้จะหมดอายุใน 10 นาที<br>
              ⚠️ กรุณาอย่าบอกรหัสนี้ให้ผู้อื่น
            </p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
              <strong>💡 คำแนะนำ:</strong> หากคุณไม่ได้ทำการสมัครสมาชิก กรุณาทิ้งอีเมลนี้ไว้หรือแจ้งทีมงาน
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

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!(resend && resendApiKey);
}

/**
 * Get email configuration status
 */
export function getEmailServiceStatus() {
  return {
    configured: isEmailServiceConfigured(),
    from: EMAIL_CONFIG.from,
    to: EMAIL_CONFIG.to,
  };
}

// ============================================================================
// BOOKING EMAILS
// ============================================================================

/**
 * Booking confirmation email data
 */
export interface BookingConfirmationData {
  to: string;
  customerName: string;
  bookingNumber: string;
  gymName: string;
  packageName: string;
  packageType: 'one_time' | 'package';
  startDate: string;
  endDate?: string | null;
  pricePaid: number;
  customerPhone?: string;
  specialRequests?: string;
  bookingUrl?: string;
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  data: BookingConfirmationData
) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: `ยืนยันการจองสำเร็จ - ${data.bookingNumber} | MUAYTHAI Platform`,
      html: generateBookingConfirmationHtml({
        customerName: data.customerName,
        bookingNumber: data.bookingNumber,
        gymName: data.gymName,
        packageName: data.packageName,
        packageType: data.packageType,
        startDate: data.startDate,
        endDate: data.endDate,
        pricePaid: data.pricePaid,
        customerPhone: data.customerPhone,
        specialRequests: data.specialRequests,
        bookingUrl: data.bookingUrl,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Booking reminder email data
 */
export interface BookingReminderData {
  to: string;
  customerName: string;
  bookingNumber: string;
  gymName: string;
  packageName: string;
  startDate: string;
  startTime?: string;
  gymAddress?: string;
  gymPhone?: string;
  bookingUrl?: string;
}

/**
 * Send booking reminder email (1 day before)
 */
export async function sendBookingReminderEmail(data: BookingReminderData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: `📅 เตือนความจำ: การจองของคุณจะเริ่มในอีก 1 วัน | MUAYTHAI Platform`,
      html: generateBookingReminderHtml({
        customerName: data.customerName,
        bookingNumber: data.bookingNumber,
        gymName: data.gymName,
        packageName: data.packageName,
        startDate: data.startDate,
        startTime: data.startTime,
        gymAddress: data.gymAddress,
        gymPhone: data.gymPhone,
        bookingUrl: data.bookingUrl,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending booking reminder email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// PAYMENT EMAILS
// ============================================================================

/**
 * Payment receipt email data
 */
export interface PaymentReceiptData {
  to: string;
  customerName: string;
  transactionNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  items: Array<{
    description: string;
    quantity?: number;
    amount: number;
  }>;
  receiptUrl?: string;
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(data: PaymentReceiptData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: `ใบเสร็จการชำระเงิน - ${data.transactionNumber} | MUAYTHAI Platform`,
      html: generatePaymentReceiptHtml({
        customerName: data.customerName,
        transactionNumber: data.transactionNumber,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        items: data.items,
        receiptUrl: data.receiptUrl,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending payment receipt email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Payment failed email data
 */
export interface PaymentFailedData {
  to: string;
  customerName: string;
  transactionNumber: string;
  amount: number;
  paymentMethod: string;
  failureReason?: string;
  retryUrl?: string;
  supportEmail?: string;
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(data: PaymentFailedData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: `การชำระเงินไม่สำเร็จ - ${data.transactionNumber} | MUAYTHAI Platform`,
      html: generatePaymentFailedHtml({
        customerName: data.customerName,
        transactionNumber: data.transactionNumber,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        failureReason: data.failureReason,
        retryUrl: data.retryUrl,
        supportEmail: data.supportEmail,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending payment failed email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// PARTNER EMAILS
// ============================================================================

/**
 * Partner approval email data
 */
export interface PartnerApprovalData {
  to: string;
  partnerName: string;
  gymName: string;
  approvalDate: string;
  dashboardUrl?: string;
}

/**
 * Send partner approval email
 */
export async function sendPartnerApprovalEmail(data: PartnerApprovalData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: `🎉 ยินดีด้วย! การสมัครค่ายมวยของคุณได้รับการอนุมัติ | MUAYTHAI Platform`,
      html: generatePartnerApprovalHtml({
        partnerName: data.partnerName,
        gymName: data.gymName,
        approvalDate: data.approvalDate,
        dashboardUrl: data.dashboardUrl,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending partner approval email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Partner rejection email data
 */
export interface PartnerRejectionData {
  to: string;
  partnerName: string;
  gymName: string;
  rejectionReason?: string;
  reapplyUrl?: string;
  supportEmail?: string;
}

/**
 * Send partner rejection email
 */
export async function sendPartnerRejectionEmail(data: PartnerRejectionData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: `การสมัครค่ายมวยของคุณยังไม่ได้รับการอนุมัติ | MUAYTHAI Platform`,
      html: generatePartnerRejectionHtml({
        partnerName: data.partnerName,
        gymName: data.gymName,
        rejectionReason: data.rejectionReason,
        reapplyUrl: data.reapplyUrl,
        supportEmail: data.supportEmail,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending partner rejection email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// ADMIN ALERT EMAILS
// ============================================================================

/**
 * Admin alert email data
 */
export interface AdminAlertData {
  to: string | string[];
  alertType: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Send admin alert email
 */
export async function sendAdminAlertEmail(data: AdminAlertData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Convert to array if single email
    const recipients = Array.isArray(data.to) ? data.to : [data.to];

    const priorityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `${priorityEmoji[data.priority || 'medium']} [${data.priority?.toUpperCase() || 'MEDIUM'}] ${data.title} | MUAYTHAI Platform`,
      html: generateAdminAlertHtml({
        alertType: data.alertType,
        title: data.title,
        message: data.message,
        details: data.details,
        actionUrl: data.actionUrl,
        priority: data.priority,
      }),
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending admin alert email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// PASSWORD RESET EMAILS
// ============================================================================

/**
 * Password reset email data
 */
export interface PasswordResetEmailData {
  to: string;
  token: string;
  email: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  if (!resend || !resendApiKey) {
    console.warn('⚠️ Resend API Key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { token, email } = data;
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password?token=${token}&email=${encodeURIComponent(email)}`;

    const htmlContent = `
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

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.to,
      subject: 'รีเซ็ตรหัสผ่าน - MUAYTHAI Platform 🥊',
      html: htmlContent,
    });

    return {
      success: !result.error,
      id: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

