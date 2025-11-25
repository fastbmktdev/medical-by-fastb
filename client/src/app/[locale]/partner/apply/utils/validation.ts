import { FormData, FormErrors } from "../types";
import {
  validateEmail as validateEmailShared,
  validatePhone as validatePhoneShared,
  VALIDATION_PATTERNS
} from "@shared/lib/utils/validation";

const validateField = (value: string, error: string): string | undefined =>
  !value.trim() ? error : undefined;

/**
 * Validate phone number for partner application
 * Uses shared validation utility
 */
const validatePhone = (phone: string): string | undefined => {
  if (!phone.trim()) return "กรุณากรอกเบอร์โทรศัพท์";

  const error = validatePhoneShared(phone, true);
  return error;
};

/**
 * Validate email for partner application
 * Uses shared validation utility
 */
const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return "กรุณากรอกอีเมล";

  const error = validateEmailShared(email, true);
  return error;
};

export const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  const validations: [keyof FormErrors, string | undefined][] = [
    ['hospitalName', validateField(formData.hospitalName, "กรุณากรอกชื่อโรงพยาบาล")],
    ['contactName', validateField(formData.contactName, "กรุณากรอกชื่อผู้ติดต่อ")],
    ['phone', validatePhone(formData.phone)],
    ['email', validateEmail(formData.email)],
    ['address', validateField(formData.address, "กรุณากรอกที่อยู่")],
    ['termsAccepted', !formData.termsAccepted ? "กรุณายืนยันความถูกต้องและรับทราบเงื่อนไข" : undefined],
  ];

  validations.forEach(([field, error]) => {
    if (error) errors[field] = error;
  });

  return errors;
};
