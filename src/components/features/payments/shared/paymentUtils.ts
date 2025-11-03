export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type PaymentType = 'gym_booking' | 'product' | 'ticket';

export interface PaymentError {
  type: 'card_declined' | 'insufficient_funds' | 'expired_card' | 'incorrect_cvc' | 'processing_error' | 'network_error' | 'generic';
  title: string;
  message: string;
  retryable: boolean;
  suggestion?: string;
}

// Constants for status mappings
const STATUS_ICON_MAP: Record<PaymentStatus, string> = {
  succeeded: 'CheckCircleIcon',
  failed: 'XCircleIcon',
  canceled: 'XCircleIcon',
  pending: 'ClockIcon',
  processing: 'ClockIcon',
  refunded: 'ArrowPathIcon',
};

const STATUS_INFO_MAP: Record<PaymentStatus, { text: string; color: string }> = {
  succeeded: { text: 'สำเร็จ', color: 'text-green-400' },
  failed: { text: 'ล้มเหลว', color: 'text-red-400' },
  pending: { text: 'รอดำเนินการ', color: 'text-yellow-400' },
  processing: { text: 'กำลังดำเนินการ', color: 'text-yellow-400' },
  canceled: { text: 'ยกเลิก', color: 'text-gray-400' },
  refunded: { text: 'คืนเงิน', color: 'text-blue-400' },
};

const PAYMENT_TYPE_MAP: Record<PaymentType, string> = {
  gym_booking: 'จองค่ายมวย',
  product: 'ซื้อสินค้า',
  ticket: 'ซื้อตั๋ว',
};

export const getStatusIconName = (status: PaymentStatus): string =>
  STATUS_ICON_MAP[status] || 'ExclamationTriangleIcon';

export const getStatusInfo = (status: PaymentStatus) =>
  STATUS_INFO_MAP[status] || { text: 'ไม่ทราบสถานะ', color: 'text-gray-400' };

export const getPaymentTypeText = (type: PaymentType): string =>
  PAYMENT_TYPE_MAP[type] || type;

/**
 * Format date for Thai locale
 */
export const formatPaymentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STRIPE_ERROR_MAP: Record<string, PaymentError> = {
  card_declined: {
    type: 'card_declined',
    title: 'บัตรถูกปฏิเสธ',
    message: 'ธนาคารของคุณปฏิเสธการทำรายการ',
    retryable: true,
    suggestion: 'กรุณาลองใช้บัตรอื่น หรือติดต่อธนาคารของคุณ',
  },
  insufficient_funds: {
    type: 'insufficient_funds',
    title: 'ยอดเงินไม่เพียงพอ',
    message: 'บัตรของคุณมีวงเงินไม่เพียงพอสำหรับการทำรายการนี้',
    retryable: true,
    suggestion: 'กรุณาใช้บัตรอื่น หรือเติมเงินในบัญชีของคุณ',
  },
  expired_card: {
    type: 'expired_card',
    title: 'บัตรหมดอายุ',
    message: 'บัตรของคุณหมดอายุแล้ว',
    retryable: false,
    suggestion: 'กรุณาใช้บัตรที่ยังไม่หมดอายุ',
  },
  incorrect_cvc: {
    type: 'incorrect_cvc',
    title: 'รหัส CVV ไม่ถูกต้อง',
    message: 'รหัส CVV ที่คุณกรอกไม่ถูกต้อง',
    retryable: true,
    suggestion: 'กรุณาตรวจสอบรหัส CVV 3 หลักด้านหลังบัตร',
  },
  processing_error: {
    type: 'processing_error',
    title: 'เกิดข้อผิดพลาดในการประมวลผล',
    message: 'ธนาคารไม่สามารถดำเนินการได้ในขณะนี้',
    retryable: true,
    suggestion: 'กรุณาลองใหม่อีกครั้งในภายหลัง',
  },
};

export const parseStripeError = (error: { code?: string; decline_code?: string; message?: string }): PaymentError => {
  const code = error.code || error.decline_code || '';
  return STRIPE_ERROR_MAP[code] || STRIPE_ERROR_MAP[code === 'invalid_cvc' ? 'incorrect_cvc' : ''] || {
    type: 'generic',
    title: 'เกิดข้อผิดพลาด',
    message: error.message || 'ไม่สามารถดำเนินการชำระเงินได้',
    retryable: true,
    suggestion: 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
  };
};

const PHONE_REGEX = /^(0[689]\d{8}|0[2-7]\d{7,8})$/;

export const isValidPhoneNumber = (phone: string): boolean =>
  !!phone && phone.length >= 9 && PHONE_REGEX.test(phone.replace(/\s/g, ''));

export const formatAmount = (amount: number): string => `฿${amount.toLocaleString()}`;

export const generatePaymentReference = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MT-${timestamp}${random}`;
};