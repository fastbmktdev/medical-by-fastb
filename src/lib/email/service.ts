/**
 * Email Service Layer
 * 
 * Centralized email service that:
 * - Checks user email preferences
 * - Adds emails to queue
 * - Provides unified interface for sending emails
 */

import { addEmailToQueue, type EmailPriority } from './queue';
// import { triggerEmailProcessing, shouldProcessImmediately } from './processor'; // Disabled - using CRON instead
import { 
  generateBookingConfirmationHtml,
  generateBookingReminderHtml,
  generatePaymentReceiptHtml,
  generatePaymentFailedHtml,
  generatePartnerApprovalHtml,
  generatePartnerRejectionHtml,
  generateAdminAlertHtml,
  generateVerificationEmailHtml,
  generateWelcomeEmailHtml,
} from './templates';
import type { 
  VerificationEmailData,
  ContactEmailData,
} from './provider';

// Extended interfaces with additional fields for service layer
export interface BookingConfirmationDataWithIds {
  to: string;
  userId?: string;
  bookingId?: string;
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

export interface BookingReminderDataWithIds {
  to: string;
  userId?: string;
  bookingId?: string;
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

export interface PaymentReceiptDataWithIds {
  to: string;
  userId?: string;
  paymentId?: string;
  customerName: string;
  receiptNumber: string;
  transactionNumber?: string;
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

export interface PaymentFailedDataWithIds {
  to: string;
  userId?: string;
  paymentId?: string;
  transactionId?: string;
  amount: number;
  reason?: string;
  retryUrl?: string;
}

export interface PartnerApprovalDataWithIds {
  to: string;
  userId?: string;
  applicationId?: string;
  gymName: string;
}

export interface PartnerRejectionDataWithIds {
  to: string;
  userId?: string;
  applicationId?: string;
  gymName: string;
  reason?: string;
}

export interface AdminAlertDataWithTo {
  to?: string;
  subject: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface EmailServiceOptions {
  priority?: EmailPriority;
  scheduledAt?: Date;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Email Service Class
 */
export class EmailService {
  /**
   * Send verification email
   */
  static async sendVerification(
    data: VerificationEmailData,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generateVerificationEmailHtml({
      otp: data.otp,
      fullName: data.fullName || 'คุณ',
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: 'ยืนยันการสมัครสมาชิก - MUAYTHAI Platform 🥊',
      htmlContent,
      emailType: 'verification',
      priority: options?.priority || 'high',
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        fullName: data.fullName,
      },
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(
    data: BookingConfirmationDataWithIds,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generateBookingConfirmationHtml({
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
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: `ยืนยันการจอง - ${data.gymName} 🥊`,
      htmlContent,
      emailType: 'booking_confirmation',
      priority: options?.priority || 'normal',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        bookingNumber: data.bookingNumber,
        gymName: data.gymName,
      },
      relatedResourceType: 'booking',
      relatedResourceId: data.bookingId,
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send booking reminder email
   */
  static async sendBookingReminder(
    data: BookingReminderDataWithIds,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generateBookingReminderHtml({
      customerName: data.customerName,
      bookingNumber: data.bookingNumber,
      gymName: data.gymName,
      packageName: data.packageName,
      startDate: data.startDate,
      startTime: data.startTime,
      gymAddress: data.gymAddress,
      gymPhone: data.gymPhone,
      bookingUrl: data.bookingUrl,
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: `แจ้งเตือนการจอง - ${data.gymName} ในอีก 1 วัน 🥊`,
      htmlContent,
      emailType: 'booking_reminder',
      priority: options?.priority || 'high',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        bookingNumber: data.bookingNumber,
        gymName: data.gymName,
      },
      relatedResourceType: 'booking',
      relatedResourceId: data.bookingId,
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send payment receipt email
   */
  static async sendPaymentReceipt(
    data: PaymentReceiptDataWithIds,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generatePaymentReceiptHtml({
      customerName: data.customerName,
      transactionNumber: data.transactionNumber || data.receiptNumber,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      items: data.items,
      receiptUrl: data.receiptUrl,
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: `ใบเสร็จการชำระเงิน - ${data.receiptNumber} 💰`,
      htmlContent,
      emailType: 'payment_receipt',
      priority: options?.priority || 'normal',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
      },
      relatedResourceType: 'payment',
      relatedResourceId: data.paymentId,
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send payment failed email
   */
  static async sendPaymentFailed(
    data: PaymentFailedDataWithIds,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generatePaymentFailedHtml({
      customerName: data.to.split('@')[0], // Extract name from email
      transactionNumber: data.transactionId || 'N/A',
      amount: data.amount,
      paymentMethod: 'Credit Card',
      failureReason: data.reason,
      retryUrl: data.retryUrl,
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: `การชำระเงินล้มเหลว - ${data.transactionId || 'Transaction'} ⚠️`,
      htmlContent,
      emailType: 'payment_failed',
      priority: options?.priority || 'high',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        transactionId: data.transactionId,
        amount: data.amount,
      },
      relatedResourceType: 'payment',
      relatedResourceId: data.paymentId,
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send partner approval email
   */
  static async sendPartnerApproval(
    data: PartnerApprovalDataWithIds,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generatePartnerApprovalHtml({
      partnerName: data.userId || 'Partner',
      gymName: data.gymName,
      approvalDate: new Date().toISOString(),
      dashboardUrl: data.applicationId ? `/partner/dashboard` : undefined,
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: `ยินดีต้อนรับเข้าสู่ระบบพาร์ทเนอร์ - ${data.gymName} 🎉`,
      htmlContent,
      emailType: 'partner_approval',
      priority: options?.priority || 'normal',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        gymName: data.gymName,
      },
      relatedResourceType: 'partner_application',
      relatedResourceId: data.applicationId,
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send partner rejection email
   */
  static async sendPartnerRejection(
    data: PartnerRejectionDataWithIds,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generatePartnerRejectionHtml({
      partnerName: data.userId || 'Partner',
      gymName: data.gymName,
      rejectionReason: data.reason,
      reapplyUrl: data.applicationId ? '/partner/apply' : undefined,
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: `ผลการสมัครพาร์ทเนอร์ - ${data.gymName}`,
      htmlContent,
      emailType: 'partner_rejection',
      priority: options?.priority || 'normal',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        gymName: data.gymName,
        reason: data.reason,
      },
      relatedResourceType: 'partner_application',
      relatedResourceId: data.applicationId,
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send admin alert email
   */
  static async sendAdminAlert(
    data: AdminAlertDataWithTo,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generateAdminAlertHtml({
      alertType: data.severity,
      title: data.subject,
      message: data.message,
      priority: data.severity === 'error' ? 'critical' : data.severity === 'warning' ? 'high' : 'medium',
    });

    const result = await addEmailToQueue({
      to: data.to || process.env.CONTACT_EMAIL_TO || 'admin@yourdomain.com',
      subject: data.subject,
      htmlContent,
      emailType: 'admin_alert',
      priority: options?.priority || (data.severity === 'error' ? 'urgent' : 'normal'),
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        severity: data.severity,
      },
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send contact form email
   */
  static async sendContactForm(
    data: ContactEmailData,
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    // Contact form emails don't use templates, send directly
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ข้อความจากแบบฟอร์มติดต่อ</h2>
        <p><strong>ชื่อ:</strong> ${data.name}</p>
        <p><strong>อีเมล:</strong> ${data.email}</p>
        <p><strong>ข้อความ:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      </div>
    `;

    const result = await addEmailToQueue({
      to: process.env.CONTACT_EMAIL_TO || 'admin@yourdomain.com',
      subject: `ข้อความจากแบบฟอร์มติดต่อ - ${data.name}`,
      htmlContent,
      emailType: 'contact_form',
      priority: options?.priority || 'normal',
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        contactName: data.name,
        contactEmail: data.email,
      },
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }

  /**
   * Send welcome email
   */
  static async sendWelcome(
    data: { to: string; name?: string; userId?: string },
    options?: EmailServiceOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const htmlContent = generateWelcomeEmailHtml({
      fullName: data.name || 'คุณ',
    });

    const result = await addEmailToQueue({
      to: data.to,
      subject: 'ยินดีต้อนรับสู่ MUAYTHAI Platform 🥊',
      htmlContent,
      emailType: 'welcome',
      priority: options?.priority || 'normal',
      userId: data.userId,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries || 3,
      metadata: {
        ...options?.metadata,
        name: data.name,
      },
    });

    // CRON job will process emails automatically (/api/cron/process-email-queue runs every 5 minutes)
    // No need to trigger processing immediately - let CRON handle it

    return result;
  }
}

