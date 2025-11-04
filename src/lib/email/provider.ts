/**
 * Email Provider Interface
 *
 * Abstract interface for email providers (SMTP, Resend, etc.)
 * This allows us to switch between providers easily
 */

/**
 * Email data interfaces
 */
export interface VerificationEmailData {
  to: string;
  otp: string;
  fullName?: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export interface BookingEmailData {
  to: string;
  bookingNumber: string;
  gymName: string;
  packageName: string;
  bookingDate: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
}

export interface PaymentEmailData {
  to: string;
  receiptNumber: string;
  amount: number;
  date: string;
  description: string;
}

export interface PartnerEmailData {
  to: string;
  gymName: string;
  reason?: string;
}

export interface AdminAlertData {
  subject: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Email result interface
 */
export interface EmailResult {
  success: boolean;
  error?: string;
  message?: string;
  id?: string;
}

/**
 * Email Provider Interface
 */
export interface EmailProvider {
  /**
   * Check if provider is configured
   */
  isConfigured(): boolean;

  /**
   * Get provider configuration status
   */
  getStatus(): {
    configured: boolean;
    provider: string;
    [key: string]: unknown;
  };

  /**
   * Send verification email with OTP
   */
  sendVerificationEmail(data: VerificationEmailData): Promise<EmailResult>;

  /**
   * Send contact form email
   */
  sendContactEmail(data: ContactEmailData): Promise<EmailResult>;

  /**
   * Send booking confirmation email
   */
  sendBookingConfirmation(data: BookingEmailData): Promise<EmailResult>;

  /**
   * Send booking reminder email
   */
  sendBookingReminder(data: BookingEmailData): Promise<EmailResult>;

  /**
   * Send payment receipt email
   */
  sendPaymentReceipt(data: PaymentEmailData): Promise<EmailResult>;

  /**
   * Send payment failed email
   */
  sendPaymentFailed(data: PaymentEmailData): Promise<EmailResult>;

  /**
   * Send partner approval email
   */
  sendPartnerApproval(data: PartnerEmailData): Promise<EmailResult>;

  /**
   * Send partner rejection email
   */
  sendPartnerRejection(data: PartnerEmailData): Promise<EmailResult>;

  /**
   * Send admin alert email
   */
  sendAdminAlert(data: AdminAlertData): Promise<EmailResult>;
}
