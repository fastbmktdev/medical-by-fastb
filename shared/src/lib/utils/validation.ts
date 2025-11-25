/**
 * Comprehensive Validation Utilities
 * Common validation functions for all forms in the application
 */

import { VALIDATION_PATTERNS, VALIDATION_RULES } from '@shared/lib/constants/validation';

// Re-export for backward compatibility
export { VALIDATION_PATTERNS, VALIDATION_RULES };

/**
 * Validate email format
 * @param email - Email string to validate
 * @param required - Whether email is required
 * @returns Error message if invalid, undefined if valid
 */
export function validateEmail(email: string, required = true): string | undefined {
  if (!email || !email.trim()) {
    return required ? 'กรุณากรอกอีเมล' : undefined;
  }

  const trimmed = email.trim();

  if (trimmed.length < VALIDATION_RULES.EMAIL.min) {
    return `อีเมลต้องมีอย่างน้อย ${VALIDATION_RULES.EMAIL.min} ตัวอักษร`;
  }

  if (trimmed.length > VALIDATION_RULES.EMAIL.max) {
    return `อีเมลต้องไม่เกิน ${VALIDATION_RULES.EMAIL.max} ตัวอักษร`;
  }

  if (!VALIDATION_PATTERNS.EMAIL.test(trimmed)) {
    return 'รูปแบบอีเมลไม่ถูกต้อง';
  }

  return undefined;
}

/**
 * Quick email validation (returns boolean)
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email, false) === undefined;
}

/**
 * Validate phone number (Thai format)
 * @param phone - Phone number string to validate
 * @param required - Whether phone is required
 * @returns Error message if invalid, undefined if valid
 */
export function validatePhone(phone: string, required = true): string | undefined {
  if (!phone || !phone.trim()) {
    return required ? 'กรุณากรอกเบอร์โทรศัพท์' : undefined;
  }

  const cleaned = phone.replace(/\s|-/g, '');
  
  if (cleaned.length < VALIDATION_RULES.PHONE.min) {
    return `เบอร์โทรศัพท์ต้องมีอย่างน้อย ${VALIDATION_RULES.PHONE.min} หลัก`;
  }

  if (cleaned.length > VALIDATION_RULES.PHONE.max) {
    return `เบอร์โทรศัพท์ต้องไม่เกิน ${VALIDATION_RULES.PHONE.max} หลัก`;
  }

  if (!VALIDATION_PATTERNS.PHONE_THAI.test(cleaned)) {
    return 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678 หรือ 02-123-4567)';
  }

  return undefined;
}

/**
 * Quick phone validation (returns boolean)
 * @param phone - Phone number string to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  return validatePhone(phone, false) === undefined;
}

/**
 * Validate phone number (International format)
 */
export function validatePhoneInternational(phone: string, required = true): string | undefined {
  if (!phone || !phone.trim()) {
    return required ? 'กรุณากรอกเบอร์โทรศัพท์' : undefined;
  }

  const cleaned = phone.replace(/\s|-/g, '');
  
  if (cleaned.length < VALIDATION_RULES.PHONE.min) {
    return `เบอร์โทรศัพท์ต้องมีอย่างน้อย ${VALIDATION_RULES.PHONE.min} หลัก`;
  }

  if (cleaned.length > VALIDATION_RULES.PHONE.max) {
    return `เบอร์โทรศัพท์ต้องไม่เกิน ${VALIDATION_RULES.PHONE.max} หลัก`;
  }

  if (!VALIDATION_PATTERNS.PHONE_INTERNATIONAL.test(cleaned)) {
    return 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น +66812345678)';
  }

  return undefined;
}

/**
 * Validate name (full name, contact name, etc.)
 */
export function validateName(name: string, fieldName = 'ชื่อ', required = true): string | undefined {
  if (!name || !name.trim()) {
    return required ? `กรุณากรอก${fieldName}` : undefined;
  }

  if (name.trim().length < VALIDATION_RULES.NAME.min) {
    return `${fieldName}ต้องมีอย่างน้อย ${VALIDATION_RULES.NAME.min} ตัวอักษร`;
  }

  if (name.trim().length > VALIDATION_RULES.NAME.max) {
    return `${fieldName}ต้องไม่เกิน ${VALIDATION_RULES.NAME.max} ตัวอักษร`;
  }

  return undefined;
}

/**
 * Validate username
 */
export function validateUsername(username: string, required = true, allowDash = false): string | undefined {
  if (!username || !username.trim()) {
    return required ? 'กรุณากรอก Username' : undefined;
  }

  if (username.trim().length < VALIDATION_RULES.USERNAME.min) {
    return `Username ต้องมีอย่างน้อย ${VALIDATION_RULES.USERNAME.min} ตัวอักษร`;
  }

  if (username.trim().length > VALIDATION_RULES.USERNAME.max) {
    return `Username ต้องไม่เกิน ${VALIDATION_RULES.USERNAME.max} ตัวอักษร`;
  }

  const pattern = allowDash ? VALIDATION_PATTERNS.USERNAME_WITH_DASH : VALIDATION_PATTERNS.USERNAME;
  if (!pattern.test(username.trim())) {
    return allowDash 
      ? 'Username ต้องประกอบด้วย ตัวอักษร ตัวเลข _ และ - เท่านั้น'
      : 'Username ต้องประกอบด้วย ตัวอักษร ตัวเลข และ _ เท่านั้น';
  }

  return undefined;
}

/**
 * Validate password
 */
export function validatePassword(password: string, required = true): string | undefined {
  if (!password) {
    return required ? 'กรุณากรอกรหัสผ่าน' : undefined;
  }

  if (password.length < VALIDATION_RULES.PASSWORD.min) {
    return `รหัสผ่านต้องมีอย่างน้อย ${VALIDATION_RULES.PASSWORD.min} ตัวอักษร`;
  }

  if (password.length > VALIDATION_RULES.PASSWORD.max) {
    return `รหัสผ่านต้องไม่เกิน ${VALIDATION_RULES.PASSWORD.max} ตัวอักษร`;
  }

  return undefined;
}

/**
 * Validate password with strength requirements
 */
export function validatePasswordStrong(password: string, required = true): string | undefined {
  const basicError = validatePassword(password, required);
  if (basicError) return basicError;

  if (!password) return undefined;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return 'รหัสผ่านต้องมีตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, ตัวเลข และอักขระพิเศษ';
  }

  return undefined;
}

/**
 * Validate confirm password
 */
export function validateConfirmPassword(password: string, confirmPassword: string, required = true): string | undefined {
  if (!confirmPassword) {
    return required ? 'กรุณายืนยันรหัสผ่าน' : undefined;
  }

  if (password !== confirmPassword) {
    return 'รหัสผ่านไม่ตรงกัน';
  }

  return undefined;
}

/**
 * Validate message/description
 */
export function validateMessage(message: string, fieldName = 'ข้อความ', required = true): string | undefined {
  if (!message || !message.trim()) {
    return required ? `กรุณากรอก${fieldName}` : undefined;
  }

  if (message.trim().length < VALIDATION_RULES.MESSAGE.min) {
    return `${fieldName}ต้องมีอย่างน้อย ${VALIDATION_RULES.MESSAGE.min} ตัวอักษร`;
  }

  if (message.trim().length > VALIDATION_RULES.MESSAGE.max) {
    return `${fieldName}ต้องไม่เกิน ${VALIDATION_RULES.MESSAGE.max} ตัวอักษร`;
  }

  return undefined;
}

/**
 * Validate subject/title
 */
export function validateSubject(subject: string, fieldName = 'หัวข้อ', required = true): string | undefined {
  if (!subject || !subject.trim()) {
    return required ? `กรุณากรอก${fieldName}` : undefined;
  }

  if (subject.trim().length < VALIDATION_RULES.SUBJECT.min) {
    return `${fieldName}ต้องมีอย่างน้อย ${VALIDATION_RULES.SUBJECT.min} ตัวอักษร`;
  }

  if (subject.trim().length > VALIDATION_RULES.SUBJECT.max) {
    return `${fieldName}ต้องไม่เกิน ${VALIDATION_RULES.SUBJECT.max} ตัวอักษร`;
  }

  return undefined;
}

/**
 * Validate address
 */
export function validateAddress(address: string, required = true): string | undefined {
  if (!address || !address.trim()) {
    return required ? 'กรุณากรอกที่อยู่' : undefined;
  }

  if (address.trim().length < VALIDATION_RULES.ADDRESS.min) {
    return `ที่อยู่ต้องมีอย่างน้อย ${VALIDATION_RULES.ADDRESS.min} ตัวอักษร`;
  }

  if (address.trim().length > VALIDATION_RULES.ADDRESS.max) {
    return `ที่อยู่ต้องไม่เกิน ${VALIDATION_RULES.ADDRESS.max} ตัวอักษร`;
  }

  return undefined;
}

/**
 * Validate URL
 */
export function validateUrl(url: string, required = true): string | undefined {
  if (!url || !url.trim()) {
    return required ? 'กรุณากรอก URL' : undefined;
  }

  if (!VALIDATION_PATTERNS.URL.test(url.trim())) {
    return 'รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)';
  }

  return undefined;
}

/**
 * Validate price
 */
export function validatePrice(price: number | string, required = true): string | undefined {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return required ? 'กรุณากรอกราคา' : undefined;
  }

  if (numPrice < VALIDATION_RULES.PRICE.min) {
    return `ราคาต้องมากกว่าหรือเท่ากับ ${VALIDATION_RULES.PRICE.min}`;
  }

  if (numPrice > VALIDATION_RULES.PRICE.max) {
    return `ราคาต้องไม่เกิน ${VALIDATION_RULES.PRICE.max}`;
  }

  return undefined;
}

/**
 * Validate date
 */
export function validateDate(date: string, required = true, minDate?: Date): string | undefined {
  if (!date) {
    return required ? 'กรุณาเลือกวันที่' : undefined;
  }

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (minDate) {
    if (selectedDate < minDate) {
      return `วันที่ต้องไม่เร็วกว่า ${minDate.toLocaleDateString('th-TH')}`;
    }
  } else {
    if (selectedDate < today) {
      return 'วันที่ต้องไม่เป็นวันที่ผ่านมาแล้ว';
    }
  }

  return undefined;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): string | undefined {
  if (!startDate || !endDate) {
    return undefined;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return 'วันที่สิ้นสุดต้องไม่เร็วกว่าวันที่เริ่มต้น';
  }

  return undefined;
}

/**
 * Validate package type
 */
export function validatePackageType(type: string): string | undefined {
  if (!type) {
    return 'กรุณาเลือกประเภทแพ็คเกจ';
  }

  if (!['one_time', 'package'].includes(type)) {
    return 'ประเภทแพ็คเกจไม่ถูกต้อง';
  }

  return undefined;
}

/**
 * Validate duration months
 */
export function validateDurationMonths(months: number | null, required = true): string | undefined {
  if (months === null || months === undefined) {
    return required ? 'กรุณาเลือกระยะเวลา' : undefined;
  }

  if (![1, 3, 6].includes(months)) {
    return 'ระยะเวลาต้องเป็น 1, 3 หรือ 6 เดือน';
  }

  return undefined;
}
