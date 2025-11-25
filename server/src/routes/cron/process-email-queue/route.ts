/**
 * Email Queue Processor API
 * 
 * POST /api/cron/process-email-queue
 * 
 * Processes emails from the email queue and sends them via SMTP or Resend
 * This endpoint should be called by a cron job (Vercel Cron or Supabase Edge Function)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getPendingEmails, 
  updateEmailQueueStatus,
  calculateNextRetryTime,
  type EmailQueueItem,
} from '@shared/lib/email/queue';
import { sendBookingConfirmationEmail, sendBookingReminderEmail, sendPaymentReceiptEmail, sendPaymentFailedEmail, sendPartnerApprovalEmail, sendPartnerRejectionEmail, sendAdminAlertEmail, sendVerificationEmail, isSmtpConfigured } from '@shared/lib/email/smtp';
import { sendBookingConfirmationEmail as sendBookingConfirmationEmailResend, sendBookingReminderEmail as sendBookingReminderEmailResend, sendPaymentReceiptEmail as sendPaymentReceiptEmailResend, sendPaymentFailedEmail as sendPaymentFailedEmailResend, sendPartnerApprovalEmail as sendPartnerApprovalEmailResend, sendPartnerRejectionEmail as sendPartnerRejectionEmailResend, sendAdminAlertEmail as sendAdminAlertEmailResend, sendVerificationEmail as sendVerificationEmailResend, isEmailServiceConfigured } from '@shared/lib/email/resend';

type EmailSendResult = { success: boolean; id?: string; error?: string };

const toMetadataRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const getStringMeta = (
  metadata: Record<string, unknown>,
  key: string,
  fallback?: string
): string | undefined => {
  const value = metadata[key];
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
};

const getNumberMeta = (
  metadata: Record<string, unknown>,
  key: string,
  fallback?: number
): number | undefined => {
  const value = metadata[key];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const normalizeResult = (result: unknown): EmailSendResult => {
  if (!result || typeof result !== 'object') {
    return { success: false, error: 'No result' };
  }

  const record = result as Record<string, unknown>;
  const success = typeof record.success === 'boolean' ? record.success : false;
  const id = typeof record.id === 'string' ? record.id : undefined;
  const errorValue = record.error;

  let error: string | undefined;
  if (typeof errorValue === 'string') {
    error = errorValue;
  } else if (
    errorValue &&
    typeof errorValue === 'object' &&
    'message' in errorValue &&
    typeof (errorValue as Record<string, unknown>).message === 'string'
  ) {
    error = (errorValue as Record<string, unknown>).message as string;
  }

  if (!success && !error) {
    error = 'Unknown error';
  }

  return { success, id, error };
};

// Maximum number of emails to process per run
const MAX_EMAILS_PER_RUN = 50;

// Verify cron secret (optional, for security)
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if configured
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get pending emails from queue
    const pendingEmails: EmailQueueItem[] = await getPendingEmails(MAX_EMAILS_PER_RUN);

    if (pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending emails to process',
        processed: 0,
      });
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each email
    for (const emailItem of pendingEmails) {
      try {
        // Update status to processing
        await updateEmailQueueStatus(emailItem.id, 'processing');

        // Determine which provider to use (default to Resend)
        // If provider is explicitly set to 'smtp', use SMTP (if configured)
        // Otherwise, default to Resend (if configured), fallback to SMTP
        const useSmtp = emailItem.provider === 'smtp' && isSmtpConfigured();
        const useResend = !useSmtp && (emailItem.provider === 'resend' || !emailItem.provider || isEmailServiceConfigured());

        let sendResult: EmailSendResult = { success: false };

        // Send email based on type
        switch (emailItem.email_type) {
          case 'booking_confirmation': {
            try {
              const bookingData = toMetadataRecord(emailItem.metadata);
              const customerName =
                getStringMeta(bookingData, 'customerName') || emailItem.to_email.split('@')[0];
              const bookingNumber = getStringMeta(bookingData, 'bookingNumber') || 'N/A';
              const hospitalName = getStringMeta(bookingData, 'hospitalName') || 'N/A';
              const packageName = getStringMeta(bookingData, 'packageName') || 'N/A';
              const packageTypeValue = getStringMeta(bookingData, 'packageType');
              const packageType: 'one_time' | 'package' =
                packageTypeValue === 'package' ? 'package' : 'one_time';
              const startDate =
                getStringMeta(bookingData, 'startDate') || new Date().toISOString();
              const endDateValue = bookingData.endDate;
              const endDate =
                typeof endDateValue === 'string'
                  ? endDateValue
                  : endDateValue === null
                    ? null
                    : undefined;
              const pricePaid = getNumberMeta(bookingData, 'pricePaid', 0) ?? 0;
              const customerPhone = getStringMeta(bookingData, 'customerPhone');
              const specialRequests = getStringMeta(bookingData, 'specialRequests');
              const bookingUrl = getStringMeta(bookingData, 'bookingUrl');

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendBookingConfirmationEmail({
                  to: emailItem.to_email,
                  customerName,
                  bookingNumber,
                  hospitalName,
                  packageName,
                  packageType,
                  startDate,
                  endDate,
                  pricePaid,
                  customerPhone,
                  specialRequests,
                  bookingUrl,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendBookingConfirmationEmailResend({
                  to: emailItem.to_email,
                  customerName,
                  bookingNumber,
                  hospitalName,
                  packageName,
                  packageType,
                  startDate,
                  endDate,
                  pricePaid,
                  customerPhone,
                  specialRequests,
                  bookingUrl,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          case 'booking_reminder': {
            try {
              const reminderData = toMetadataRecord(emailItem.metadata);
              const customerName =
                getStringMeta(reminderData, 'customerName') || emailItem.to_email.split('@')[0];
              const bookingNumber = getStringMeta(reminderData, 'bookingNumber') || 'N/A';
              const hospitalName = getStringMeta(reminderData, 'hospitalName') || 'N/A';
              const packageName = getStringMeta(reminderData, 'packageName') || 'N/A';
              const startDate =
                getStringMeta(reminderData, 'startDate') || new Date().toISOString();
              const startTime = getStringMeta(reminderData, 'startTime');
              const hospitalAddress = getStringMeta(reminderData, 'hospitalAddress') || getStringMeta(reminderData, 'gymAddress');
              const hospitalPhone = getStringMeta(reminderData, 'hospitalPhone') || getStringMeta(reminderData, 'gymPhone');
              const bookingUrl = getStringMeta(reminderData, 'bookingUrl');

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendBookingReminderEmail({
                  to: emailItem.to_email,
                  customerName,
                  bookingNumber,
                  hospitalName,
                  packageName,
                  startDate,
                  startTime,
                  hospitalAddress,
                  hospitalPhone,
                  bookingUrl,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendBookingReminderEmailResend({
                  to: emailItem.to_email,
                  customerName,
                  bookingNumber,
                  hospitalName,
                  packageName,
                  startDate,
                  startTime,
                  hospitalAddress,
                  hospitalPhone,
                  bookingUrl,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }


          case 'payment_receipt': {
            try {
              const paymentData = toMetadataRecord(emailItem.metadata);
              const customerName =
                getStringMeta(paymentData, 'customerName') || emailItem.to_email.split('@')[0];
              const transactionNumber =
                getStringMeta(paymentData, 'transactionNumber') ||
                getStringMeta(paymentData, 'receiptNumber') ||
                'N/A';
              const amount = getNumberMeta(paymentData, 'amount', 0) ?? 0;
              const paymentMethod = getStringMeta(paymentData, 'paymentMethod') || 'Credit Card';
              const paymentDate =
                getStringMeta(paymentData, 'paymentDate') || new Date().toISOString();
              const itemsRaw = paymentData.items;
              const items =
                Array.isArray(itemsRaw)
                  ? itemsRaw.map((item) => {
                      const itemRecord = toMetadataRecord(item);
                      return {
                        description:
                          getStringMeta(itemRecord, 'description') ||
                          getStringMeta(itemRecord, 'name') ||
                          'Item',
                        quantity: getNumberMeta(itemRecord, 'quantity'),
                        amount: getNumberMeta(itemRecord, 'amount', 0) ?? 0,
                      };
                    })
                  : [];
              const receiptUrl = getStringMeta(paymentData, 'receiptUrl');

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendPaymentReceiptEmail({
                  to: emailItem.to_email,
                  customerName,
                  transactionNumber,
                  amount,
                  paymentMethod,
                  paymentDate,
                  items,
                  receiptUrl,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendPaymentReceiptEmailResend({
                  to: emailItem.to_email,
                  customerName,
                  transactionNumber,
                  amount,
                  paymentMethod,
                  paymentDate,
                  items,
                  receiptUrl,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          case 'payment_failed': {
            try {
              const paymentData = toMetadataRecord(emailItem.metadata);
              const customerName =
                getStringMeta(paymentData, 'customerName') || emailItem.to_email.split('@')[0];
              const transactionNumber =
                getStringMeta(paymentData, 'transactionId') || 'N/A';
              const amount = getNumberMeta(paymentData, 'amount', 0) ?? 0;
              const paymentMethod = getStringMeta(paymentData, 'paymentMethod') || 'Credit Card';
              const failureReason = getStringMeta(paymentData, 'reason');
              const retryUrl = getStringMeta(paymentData, 'retryUrl');

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendPaymentFailedEmail({
                  to: emailItem.to_email,
                  customerName,
                  transactionNumber,
                  amount,
                  paymentMethod,
                  failureReason,
                  retryUrl,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendPaymentFailedEmailResend({
                  to: emailItem.to_email,
                  customerName,
                  transactionNumber,
                  amount,
                  paymentMethod,
                  failureReason,
                  retryUrl,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          case 'partner_approval': {
            try {
              const partnerData = toMetadataRecord(emailItem.metadata);
              const partnerName =
                getStringMeta(partnerData, 'partnerName') ||
                getStringMeta(partnerData, 'contactName') ||
                'Partner';
              const hospitalName = getStringMeta(partnerData, 'hospitalName') || 'N/A';
              const approvalDate =
                getStringMeta(partnerData, 'approvalDate') || new Date().toISOString();
              const dashboardUrl = getStringMeta(partnerData, 'dashboardUrl');

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendPartnerApprovalEmail({
                  to: emailItem.to_email,
                  partnerName,
                  hospitalName,
                  approvalDate,
                  dashboardUrl: dashboardUrl || undefined,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendPartnerApprovalEmailResend({
                  to: emailItem.to_email,
                  partnerName,
                  hospitalName,
                  approvalDate,
                  dashboardUrl: dashboardUrl || undefined,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          case 'partner_rejection': {
            try {
              const partnerData = toMetadataRecord(emailItem.metadata);
              const partnerName =
                getStringMeta(partnerData, 'partnerName') ||
                getStringMeta(partnerData, 'contactName') ||
                'Partner';
              const hospitalName = getStringMeta(partnerData, 'hospitalName') || 'N/A';
              const rejectionReason =
                getStringMeta(partnerData, 'reason') ||
                getStringMeta(partnerData, 'rejectionReason') ||
                undefined;
              const reapplyUrl = getStringMeta(partnerData, 'reapplyUrl');

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendPartnerRejectionEmail({
                  to: emailItem.to_email,
                  partnerName,
                  hospitalName,
                  rejectionReason,
                  reapplyUrl: reapplyUrl || undefined,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendPartnerRejectionEmailResend({
                  to: emailItem.to_email,
                  partnerName,
                  hospitalName,
                  rejectionReason,
                  reapplyUrl: reapplyUrl || undefined,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          case 'admin_alert': {
            try {
              const alertData = toMetadataRecord(emailItem.metadata);
              const alertType = getStringMeta(alertData, 'alertType') || 'general';
              const title =
                emailItem.subject || getStringMeta(alertData, 'title') || 'Admin Alert';
              const message =
                getStringMeta(alertData, 'message') || emailItem.html_content;
              const severity = getStringMeta(alertData, 'severity');
              const priority =
                severity === 'error'
                  ? 'critical'
                  : severity === 'warning'
                    ? 'high'
                    : 'medium';

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendAdminAlertEmail({
                  to: emailItem.to_email,
                  alertType,
                  title,
                  message,
                  priority,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendAdminAlertEmailResend({
                  to: emailItem.to_email,
                  alertType,
                  title,
                  message,
                  priority,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          case 'verification': {
            try {
              const verificationData = toMetadataRecord(emailItem.metadata);
              const otp = getStringMeta(verificationData, 'otp') || 'N/A';
              const fullName =
                getStringMeta(verificationData, 'fullName') ||
                emailItem.to_email.split('@')[0];

              if (useSmtp && isSmtpConfigured()) {
                sendResult = normalizeResult(await sendVerificationEmail({
                  to: emailItem.to_email,
                  otp,
                  fullName,
                }));
              } else if (useResend) {
                sendResult = normalizeResult(await sendVerificationEmailResend({
                  to: emailItem.to_email,
                  otp,
                  fullName,
                }));
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }

          default: {
            // Generic email sending (for other types)
            try {
              // Try SMTP first
              if (useSmtp && isSmtpConfigured()) {
                const nodemailer = await import('nodemailer');
                const transporter = nodemailer.default.createTransport({
                  host: process.env.SMTP_HOST || 'smtp.gmail.com',
                  port: parseInt(process.env.SMTP_PORT || '587'),
                  secure: process.env.SMTP_SECURE === 'true' || false,
                  auth: {
                    user: process.env.SMTP_USER || '',
                    pass: process.env.SMTP_PASS || '',
                  },
                });

                const info = await transporter.sendMail({
                  from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@yourdomain.com',
                  to: emailItem.to_email,
                  subject: emailItem.subject,
                  html: emailItem.html_content,
                  text: emailItem.text_content || undefined,
                });

                sendResult = { success: true, id: info.messageId };
              } else if (useResend && isEmailServiceConfigured()) {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                
                const result = await resend.emails.send({
                  from: process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev',
                  to: emailItem.to_email,
                  subject: emailItem.subject,
                  html: emailItem.html_content,
                });

                sendResult = {
                  success: !result.error,
                  id: result.data?.id,
                  error: result.error?.message,
                };
              }
            } catch (error) {
              sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
            break;
          }
        }

        // Update queue status based on result
        if (sendResult.success) {
          await updateEmailQueueStatus(emailItem.id, 'sent', {
            providerMessageId: sendResult.id,
          });
          results.sent++;
        } else {
          // Check if we should retry
          const newRetryCount = emailItem.retry_count + 1;
          
          if (newRetryCount < emailItem.max_retries) {
            // Schedule retry with exponential backoff
            const nextRetryAt = calculateNextRetryTime(newRetryCount);
            await updateEmailQueueStatus(emailItem.id, 'failed', {
              errorMessage: sendResult.error || 'Unknown error',
              retryCount: newRetryCount,
              nextRetryAt,
            });
            results.failed++;
          } else {
            // Max retries reached, mark as failed permanently
            await updateEmailQueueStatus(emailItem.id, 'failed', {
              errorMessage: sendResult.error || 'Max retries reached',
              retryCount: newRetryCount,
            });
            results.failed++;
          }
        }

        results.processed++;
      } catch (error) {
        console.error(`Error processing email ${emailItem.id}:`, error);
        results.errors.push(`Email ${emailItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Mark as failed
        await updateEmailQueueStatus(emailItem.id, 'failed', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} emails`,
      results,
    });

  } catch (error) {
    console.error('Error processing email queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process email queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for monitoring
export async function GET() {
  try {
    const { getQueueStats } = await import('@shared/lib/email/queue');
    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get queue stats',
      },
      { status: 500 }
    );
  }
}

