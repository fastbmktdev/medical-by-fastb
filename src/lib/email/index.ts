// Email Utilities Barrel Export
export { 
  sendContactEmail, 
  sendWelcomeEmail,
  isEmailServiceConfigured,
  getEmailServiceStatus,
  type ContactEmailData,
  // Booking Emails
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  type BookingConfirmationData,
  type BookingReminderData,
  // Payment Emails
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  type PaymentReceiptData,
  type PaymentFailedData,
  // Partner Emails
  sendPartnerApprovalEmail,
  sendPartnerRejectionEmail,
  type PartnerApprovalData,
  type PartnerRejectionData,
  // Admin Alerts
  sendAdminAlertEmail,
  type AdminAlertData,
} from './resend';

// Email Templates (for reference/testing)
export * from './templates';
