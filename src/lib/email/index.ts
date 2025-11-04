// Email Utilities Barrel Export
// Resend Email Service (Primary)
export { 
  sendContactEmail, 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  isEmailServiceConfigured,
  getEmailServiceStatus,
  type ContactEmailData,
  type PasswordResetEmailData,
  // Verification Emails (Resend - Primary)
  sendVerificationEmail,
  type VerificationEmailData,
  // Booking Emails (Resend - Primary)
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  type BookingConfirmationData,
  type BookingReminderData,
  // Payment Emails (Resend - Primary)
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  type PaymentReceiptData,
  type PaymentFailedData,
  // Partner Emails (Resend - Primary)
  sendPartnerApprovalEmail,
  sendPartnerRejectionEmail,
  type PartnerApprovalData,
  type PartnerRejectionData,
  // Admin Alerts (Resend - Primary)
  sendAdminAlertEmail,
  type AdminAlertData,
} from './resend';

// SMTP Email Service (Legacy/Fallback - deprecated)
export {
  sendVerificationEmail as sendVerificationEmailSMTP,
  isSmtpConfigured,
  getSmtpStatus,
  // Booking Emails (SMTP - deprecated)
  sendBookingConfirmationEmail as sendBookingConfirmationEmailSMTP,
  sendBookingReminderEmail as sendBookingReminderEmailSMTP,
  // Payment Emails (SMTP - deprecated)
  sendPaymentReceiptEmail as sendPaymentReceiptEmailSMTP,
  sendPaymentFailedEmail as sendPaymentFailedEmailSMTP,
  // Partner Emails (SMTP - deprecated)
  sendPartnerApprovalEmail as sendPartnerApprovalEmailSMTP,
  sendPartnerRejectionEmail as sendPartnerRejectionEmailSMTP,
  // Admin Alerts (SMTP - deprecated)
  sendAdminAlertEmail as sendAdminAlertEmailSMTP,
} from './smtp';

// Email Templates (for reference/testing)
export * from './templates';

// Email Queue System
export {
  addEmailToQueue,
  getPendingEmails,
  updateEmailQueueStatus,
  calculateNextRetryTime,
  getQueueStats,
  type EmailQueueItem,
  type EmailStatus,
  type EmailPriority,
  type EmailType,
} from './queue';

// Email Service Layer (Centralized Service)
export {
  EmailService,
  type BookingConfirmationDataWithIds,
  type BookingReminderDataWithIds,
  type PaymentReceiptDataWithIds,
  type PaymentFailedDataWithIds,
  type PartnerApprovalDataWithIds,
  type PartnerRejectionDataWithIds,
  type AdminAlertDataWithTo,
  type EmailServiceOptions,
} from './service';
