/**
 * Queue-based Email Processor
 * 
 * POST /api/queue/process-email
 * 
 * Processes emails from queue when triggered (event-driven approach)
 * This replaces the cron job approach - call this API when emails are added to queue
 * 
 * Usage:
 * - Call from API routes when adding emails to queue
 * - Call from database triggers (via webhook)
 * - Call manually for immediate processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { 
  getPendingEmails, 
  updateEmailQueueStatus,
  calculateNextRetryTime,
  type EmailQueueItem,
} from '@/lib/email/queue';
import { sendBookingConfirmationEmail, sendBookingReminderEmail, sendPaymentReceiptEmail, sendPaymentFailedEmail, sendPartnerApprovalEmail, sendPartnerRejectionEmail, sendAdminAlertEmail, sendVerificationEmail, isSmtpConfigured } from '@/lib/email/smtp';
import { sendBookingConfirmationEmail as sendBookingConfirmationEmailResend, sendBookingReminderEmail as sendBookingReminderEmailResend, sendPaymentReceiptEmail as sendPaymentReceiptEmailResend, sendPaymentFailedEmail as sendPaymentFailedEmailResend, sendPartnerApprovalEmail as sendPartnerApprovalEmailResend, sendPartnerRejectionEmail as sendPartnerRejectionEmailResend, sendAdminAlertEmail as sendAdminAlertEmailResend, sendVerificationEmail as sendVerificationEmailResend, isEmailServiceConfigured } from '@/lib/email/resend';

// Maximum number of emails to process per run
const MAX_EMAILS_PER_RUN = 50;

// Rate limiting: prevent multiple concurrent processing
let isProcessing = false;

export async function POST(request: NextRequest) {
  try {
    // Prevent concurrent processing
    if (isProcessing) {
      return NextResponse.json({
        success: true,
        message: 'Processing already in progress',
        processed: 0,
      });
    }

    isProcessing = true;

    try {
      // Get pending emails from queue
      const pendingEmails = await getPendingEmails(MAX_EMAILS_PER_RUN);

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

      // Process each email (same logic as cron job)
      for (const emailItem of pendingEmails) {
        try {
          // Update status to processing
          await updateEmailQueueStatus(emailItem.id, 'processing');

          // Determine which provider to use (default to Resend)
          // If provider is explicitly set to 'smtp', use SMTP (if configured)
          // Otherwise, default to Resend (if configured), fallback to SMTP
          const useSmtp = emailItem.provider === 'smtp' && isSmtpConfigured();
          const useResend = !useSmtp && (emailItem.provider === 'resend' || !emailItem.provider || isEmailServiceConfigured());

          let sendResult: { success: boolean; id?: string; error?: string } = { success: false };
          
          // Helper function to normalize send result
          const normalizeResult = (result: any): { success: boolean; id?: string; error?: string } => {
            if (!result) return { success: false, error: 'No result' };
            return {
              success: result.success || false,
              id: result.id || undefined,
              error: result.error ? (typeof result.error === 'string' ? result.error : result.error.message || 'Unknown error') : undefined,
            };
          };

          // Send email based on type (same switch statement as cron job)
          switch (emailItem.email_type) {
            case 'booking_confirmation': {
              try {
                const bookingData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendBookingConfirmationEmail({
                    to: emailItem.to_email,
                    customerName: bookingData.customerName || emailItem.to_email.split('@')[0],
                    bookingNumber: bookingData.bookingNumber || 'N/A',
                    gymName: bookingData.gymName || 'N/A',
                    packageName: bookingData.packageName || 'N/A',
                    packageType: bookingData.packageType || 'one_time',
                    startDate: bookingData.startDate || new Date().toISOString(),
                    endDate: bookingData.endDate,
                    pricePaid: bookingData.pricePaid || 0,
                    customerPhone: bookingData.customerPhone,
                    specialRequests: bookingData.specialRequests,
                    bookingUrl: bookingData.bookingUrl,
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendBookingConfirmationEmailResend({
                    to: emailItem.to_email,
                    customerName: bookingData.customerName || emailItem.to_email.split('@')[0],
                    bookingNumber: bookingData.bookingNumber || 'N/A',
                    gymName: bookingData.gymName || 'N/A',
                    packageName: bookingData.packageName || 'N/A',
                    packageType: bookingData.packageType || 'one_time',
                    startDate: bookingData.startDate || new Date().toISOString(),
                    endDate: bookingData.endDate,
                    pricePaid: bookingData.pricePaid || 0,
                    customerPhone: bookingData.customerPhone,
                    specialRequests: bookingData.specialRequests,
                    bookingUrl: bookingData.bookingUrl,
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'booking_reminder': {
              try {
                const reminderData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendBookingReminderEmail({
                    to: emailItem.to_email,
                    customerName: reminderData.customerName || emailItem.to_email.split('@')[0],
                    bookingNumber: reminderData.bookingNumber || 'N/A',
                    gymName: reminderData.gymName || 'N/A',
                    packageName: reminderData.packageName || 'N/A',
                    startDate: reminderData.startDate || new Date().toISOString(),
                    startTime: reminderData.startTime,
                    gymAddress: reminderData.gymAddress,
                    gymPhone: reminderData.gymPhone,
                    bookingUrl: reminderData.bookingUrl,
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendBookingReminderEmailResend({
                    to: emailItem.to_email,
                    customerName: reminderData.customerName || emailItem.to_email.split('@')[0],
                    bookingNumber: reminderData.bookingNumber || 'N/A',
                    gymName: reminderData.gymName || 'N/A',
                    packageName: reminderData.packageName || 'N/A',
                    startDate: reminderData.startDate || new Date().toISOString(),
                    startTime: reminderData.startTime,
                    gymAddress: reminderData.gymAddress,
                    gymPhone: reminderData.gymPhone,
                    bookingUrl: reminderData.bookingUrl,
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'payment_receipt': {
              try {
                const paymentData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendPaymentReceiptEmail({
                    to: emailItem.to_email,
                    customerName: paymentData.customerName || emailItem.to_email.split('@')[0],
                    transactionNumber: paymentData.transactionNumber || paymentData.receiptNumber || 'N/A',
                    amount: paymentData.amount || 0,
                    paymentMethod: paymentData.paymentMethod || 'Credit Card',
                    paymentDate: paymentData.paymentDate || new Date().toISOString(),
                    items: paymentData.items || [],
                    receiptUrl: paymentData.receiptUrl,
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendPaymentReceiptEmailResend({
                    to: emailItem.to_email,
                    customerName: paymentData.customerName || emailItem.to_email.split('@')[0],
                    transactionNumber: paymentData.transactionNumber || paymentData.receiptNumber || 'N/A',
                    amount: paymentData.amount || 0,
                    paymentMethod: paymentData.paymentMethod || 'Credit Card',
                    paymentDate: paymentData.paymentDate || new Date().toISOString(),
                    items: paymentData.items || [],
                    receiptUrl: paymentData.receiptUrl,
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'payment_failed': {
              try {
                const paymentData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendPaymentFailedEmail({
                    to: emailItem.to_email,
                    customerName: paymentData.customerName || emailItem.to_email.split('@')[0],
                    transactionNumber: paymentData.transactionId || 'N/A',
                    amount: paymentData.amount || 0,
                    paymentMethod: paymentData.paymentMethod || 'Credit Card',
                    failureReason: paymentData.reason,
                    retryUrl: paymentData.retryUrl,
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendPaymentFailedEmailResend({
                    to: emailItem.to_email,
                    customerName: paymentData.customerName || emailItem.to_email.split('@')[0],
                    transactionNumber: paymentData.transactionId || 'N/A',
                    amount: paymentData.amount || 0,
                    paymentMethod: paymentData.paymentMethod || 'Credit Card',
                    failureReason: paymentData.reason,
                    retryUrl: paymentData.retryUrl,
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'partner_approval': {
              try {
                const partnerData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendPartnerApprovalEmail({
                    to: emailItem.to_email,
                    partnerName: partnerData.partnerName || partnerData.contactName || 'Partner',
                    gymName: partnerData.gymName || 'N/A',
                    approvalDate: partnerData.approvalDate || new Date().toISOString(),
                    dashboardUrl: partnerData.dashboardUrl || undefined,
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendPartnerApprovalEmailResend({
                    to: emailItem.to_email,
                    partnerName: partnerData.partnerName || partnerData.contactName || 'Partner',
                    gymName: partnerData.gymName || 'N/A',
                    approvalDate: partnerData.approvalDate || new Date().toISOString(),
                    dashboardUrl: partnerData.dashboardUrl || undefined,
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'partner_rejection': {
              try {
                const partnerData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendPartnerRejectionEmail({
                    to: emailItem.to_email,
                    partnerName: partnerData.partnerName || partnerData.contactName || 'Partner',
                    gymName: partnerData.gymName || 'N/A',
                    rejectionReason: partnerData.reason || partnerData.rejectionReason || undefined,
                    reapplyUrl: partnerData.reapplyUrl || undefined,
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendPartnerRejectionEmailResend({
                    to: emailItem.to_email,
                    partnerName: partnerData.partnerName || partnerData.contactName || 'Partner',
                    gymName: partnerData.gymName || 'N/A',
                    rejectionReason: partnerData.reason || partnerData.rejectionReason || undefined,
                    reapplyUrl: partnerData.reapplyUrl || undefined,
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'admin_alert': {
              try {
                const alertData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendAdminAlertEmail({
                    to: emailItem.to_email,
                    alertType: alertData.alertType || 'general',
                    title: emailItem.subject || alertData.title || 'Admin Alert',
                    message: alertData.message || emailItem.html_content,
                    priority: alertData.severity === 'error' ? 'critical' : alertData.severity === 'warning' ? 'high' : 'medium',
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendAdminAlertEmailResend({
                    to: emailItem.to_email,
                    alertType: alertData.alertType || 'general',
                    title: emailItem.subject || alertData.title || 'Admin Alert',
                    message: alertData.message || emailItem.html_content,
                    priority: alertData.severity === 'error' ? 'critical' : alertData.severity === 'warning' ? 'high' : 'medium',
                  }));
                }
              } catch (error) {
                sendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'verification': {
              try {
                const verificationData = emailItem.metadata as any;
                if (useSmtp && isSmtpConfigured()) {
                  sendResult = normalizeResult(await sendVerificationEmail({
                    to: emailItem.to_email,
                    otp: verificationData.otp || 'N/A',
                    fullName: verificationData.fullName || emailItem.to_email.split('@')[0],
                  }));
                } else if (useResend) {
                  sendResult = normalizeResult(await sendVerificationEmailResend({
                    to: emailItem.to_email,
                    otp: verificationData.otp || 'N/A',
                    fullName: verificationData.fullName || emailItem.to_email.split('@')[0],
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
                const supabase = await createClient();
                
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

    } finally {
      isProcessing = false;
    }

  } catch (error) {
    isProcessing = false;
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
    const { getQueueStats } = await import('@/lib/email/queue');
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

