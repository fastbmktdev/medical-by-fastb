import { FormData, FormErrors } from "../types";

const PHONE_REGEX = /^[0-9]{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateField = (value: string, error: string): string | undefined =>
  !value.trim() ? error : undefined;

const validatePhone = (phone: string): string | undefined => {
  if (!phone.trim()) return "กรุณากรอกเบอร์โทรศัพท์";
  return !PHONE_REGEX.test(phone.replace(/-/g, "")) ? "เบอร์โทรศัพท์ไม่ถูกต้อง (9-10 หลัก)" : undefined;
};

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return "กรุณากรอกอีเมล";
  return !EMAIL_REGEX.test(email) ? "รูปแบบอีเมลไม่ถูกต้อง" : undefined;
};

export const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  const validations: [keyof FormErrors, string | undefined][] = [
    ['gymName', validateField(formData.gymName, "กรุณากรอกชื่อยิม")],
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

