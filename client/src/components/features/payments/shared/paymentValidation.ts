/**
 * Shared payment validation utilities
 * Consolidates payment form validation logic
 */

export interface PaymentFormData {
  phoneNumber: string;
  amount: number;
  paymentType: string;
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phone: string): ValidationError | null => {
  if (!phone || phone.trim().length === 0) {
    return {
      field: 'phoneNumber',
      message: 'กรุณากรอกเบอร์โทรศัพท์',
    };
  }

  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.length < 9) {
    return {
      field: 'phoneNumber',
      message: 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก',
    };
  }

  const phoneRegex = /^(0[689]\d{8}|0[2-7]\d{7,8})$/;
  if (!phoneRegex.test(cleanPhone)) {
    return {
      field: 'phoneNumber',
      message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678)',
    };
  }

  return null;
};

/**
 * Validate payment amount
 */
export const validateAmount = (amount: number): ValidationError | null => {
  if (!amount || typeof amount !== 'number') {
    return {
      field: 'amount',
      message: 'จำนวนเงินไม่ถูกต้อง',
    };
  }

  if (amount <= 0) {
    return {
      field: 'amount',
      message: 'จำนวนเงินต้องมากกว่า 0',
    };
  }

  if (amount > 999999) {
    return {
      field: 'amount',
      message: 'จำนวนเงินต้องไม่เกิน 999,999 บาท',
    };
  }

  return null;
};

/**
 * Validate payment type
 */
export const validatePaymentType = (paymentType: string): ValidationError | null => {
  const validTypes = ['hospital_booking', 'product', 'ticket'];
  
  if (!paymentType || !validTypes.includes(paymentType)) {
    return {
      field: 'paymentType',
      message: 'ประเภทการชำระเงินไม่ถูกต้อง',
    };
  }

  return null;
};

/**
 * Validate complete payment form
 */
export const validatePaymentForm = (data: PaymentFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate phone number
  const phoneError = validatePhoneNumber(data.phoneNumber);
  if (phoneError) errors.push(phoneError);

  // Validate amount
  const amountError = validateAmount(data.amount);
  if (amountError) errors.push(amountError);

  // Validate payment type
  const typeError = validatePaymentType(data.paymentType);
  if (typeError) errors.push(typeError);

  return errors;
};

/**
 * Check if form has validation errors
 */
export const hasValidationErrors = (errors: ValidationError[]): boolean => {
  return errors.length > 0;
};

/**
 * Get error message for specific field
 */
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find(err => err.field === field);
  return error ? error.message : null;
};