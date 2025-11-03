/**
 * Email Service using SMTP (Google Gmail SMTP)
 * 
 * This service is for sending emails via SMTP when Resend is not available
 * Uses nodemailer with Google SMTP configuration
 */

import nodemailer from 'nodemailer';
import {
  generateBookingConfirmationHtml,
  generateBookingReminderHtml,
  generatePaymentReceiptHtml,
  generatePaymentFailedHtml,
  generatePartnerApprovalHtml,
  generatePartnerRejectionHtml,
  generateAdminAlertHtml,
} from './templates';

/**
 * SMTP Configuration
 * These values should be set in environment variables
 */
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '', // App Password for Gmail
  },
};

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@yourdomain.com',
  to: process.env.CONTACT_EMAIL_TO || 'admin@yourdomain.com',
};

/**
 * Verification Email Data
 */
export interface VerificationEmailData {
  to: string;
  otp: string;
  fullName?: string;
}

/**
 * Check if SMTP is configured
 */
export function isSmtpConfigured(): boolean {
  return !!(SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass);
}

/**
 * Get SMTP configuration status
 */
export function getSmtpStatus() {
  return {
    configured: isSmtpConfigured(),
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    from: EMAIL_CONFIG.from,
    user: SMTP_CONFIG.auth.user ? 'Set' : 'Not set',
    pass: SMTP_CONFIG.auth.pass ? 'Set' : 'Not set',
  };
}

/**
 * Create SMTP transporter
 */
function createTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
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
 * Send verification email with OTP via SMTP
 */
export async function sendVerificationEmail(data: VerificationEmailData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { to, otp, fullName = 'คุณ' } = data;

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'ยืนยันการสมัครสมาชิก - MUAYTHAI Platform 🥊',
      html: generateVerificationEmailHtml({ otp, fullName }),
    });

    console.log('✅ Email sent successfully via SMTP:', info.messageId);
    return {
      success: true,
      id: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending email via SMTP:', error);
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
 * Send booking confirmation email via SMTP
 */
export async function sendBookingConfirmationEmail(data: BookingConfirmationData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
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
      success: true,
      id: info.messageId,
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
 * Send booking reminder email via SMTP
 */
export async function sendBookingReminderEmail(data: BookingReminderData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
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
      success: true,
      id: info.messageId,
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
 * Send payment receipt email via SMTP
 */
export async function sendPaymentReceiptEmail(data: PaymentReceiptData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
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
      success: true,
      id: info.messageId,
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
 * Send payment failed email via SMTP
 */
export async function sendPaymentFailedEmail(data: PaymentFailedData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
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
      success: true,
      id: info.messageId,
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
 * Send partner approval email via SMTP
 */
export async function sendPartnerApprovalEmail(data: PartnerApprovalData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
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
      success: true,
      id: info.messageId,
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
 * Send partner rejection email via SMTP
 */
export async function sendPartnerRejectionEmail(data: PartnerRejectionData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
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
      success: true,
      id: info.messageId,
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
 * Send admin alert email via SMTP
 */
export async function sendAdminAlertEmail(data: AdminAlertData) {
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();

    const priorityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    // Convert to array if single email
    const recipients = Array.isArray(data.to) ? data.to : [data.to];

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients.join(','),
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
      success: true,
      id: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending admin alert email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

