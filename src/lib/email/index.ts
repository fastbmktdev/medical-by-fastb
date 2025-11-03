// Email Utilities Barrel Export
// Legacy Resend exports (deprecated - use SMTP instead)
export { 
  sendContactEmail, 
  sendWelcomeEmail,
  isEmailServiceConfigured,
  getEmailServiceStatus,
  type ContactEmailData,
  // Verification Emails (Resend)
  sendVerificationEmail as sendVerificationEmailResend,
  type VerificationEmailData,
  // Booking Emails (Resend - deprecated)
  sendBookingConfirmationEmail as sendBookingConfirmationEmailResend,
  sendBookingReminderEmail as sendBookingReminderEmailResend,
  type BookingConfirmationData,
  type BookingReminderData,
  // Payment Emails (Resend - deprecated)
  sendPaymentReceiptEmail as sendPaymentReceiptEmailResend,
  sendPaymentFailedEmail as sendPaymentFailedEmailResend,
  type PaymentReceiptData,
  type PaymentFailedData,
  // Partner Emails (Resend - deprecated)
  sendPartnerApprovalEmail as sendPartnerApprovalEmailResend,
  sendPartnerRejectionEmail as sendPartnerRejectionEmailResend,
  type PartnerApprovalData,
  type PartnerRejectionData,
  // Admin Alerts (Resend - deprecated)
  sendAdminAlertEmail as sendAdminAlertEmailResend,
  type AdminAlertData,
} from './resend';

// SMTP Email Service (Primary - uses Google SMTP)
export {
  sendVerificationEmail,
  isSmtpConfigured,
  getSmtpStatus,
  // Booking Emails
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  // Payment Emails
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  // Partner Emails
  sendPartnerApprovalEmail,
  sendPartnerRejectionEmail,
  // Admin Alerts
  sendAdminAlertEmail,
} from './smtp';

// Email Templates (for reference/testing)
export * from './templates';
