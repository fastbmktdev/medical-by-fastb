"use client";

import { useState } from "react";
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared";
import { ContactMap } from "@/components/shared/maps/ContactMap";
import { showSuccessToast, showErrorToast } from '@shared/lib/utils';
import { validateName, validateEmail, validatePhone, validateSubject, validateMessage } from '@shared/lib/utils/validation';
import { Link } from "@/navigation";
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";
import { cn } from '@shared/lib/utils/cn';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    inquiryType: "general"
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    const nameError = validateName(formData.name, 'ชื่อ-นามสกุล');
    if (nameError) newErrors.name = nameError;

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Validate phone (optional)
    if (formData.phone) {
      const phoneError = validatePhone(formData.phone, false);
      if (phoneError) newErrors.phone = phoneError;
    }

    // Validate subject
    const subjectError = validateSubject(formData.subject);
    if (subjectError) newErrors.subject = subjectError;

    // Validate message
    const messageError = validateMessage(formData.message);
    if (messageError) newErrors.message = messageError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      showErrorToast("กรุณากรอกข้อมูลให้ถูกต้อง");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `${formData.subject}\n\nประเภท: ${formData.inquiryType}${formData.phone ? `\nเบอร์โทร: ${formData.phone}` : ''}\n\n${formData.message}`,
        }),
      });

      // Check for CSRF error (HTTP 403)
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (data.code === 'CSRF_ERROR') {
          showErrorToast('Invalid request origin. Please refresh the page and try again.');
          return;
        }
      }

      // Check for rate limit error (HTTP 429)
      if (response.status === 429) {
        const { checkRateLimitError, formatRateLimitMessageThai } = await import('@shared/lib/utils/rate-limit-error');
        const rateLimitError = await checkRateLimitError(response);
        
        if (rateLimitError) {
          showErrorToast(formatRateLimitMessageThai(rateLimitError));
          return;
        }
      }

      const data = await response.json();

      if (data.success) {
        showSuccessToast("ส่งข้อความเรียบร้อยแล้ว! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          inquiryType: "general"
        });
        setErrors({});
      } else {
        showErrorToast(data.error || 'เกิดข้อผิดพลาดในการส่งข้อความ');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      showErrorToast('เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <EnvelopeIcon className="w-6 h-6 text-red-500" />,
      title: "อีเมล",
      details: ["support@medicalnext.com", "info@medicalnext.com"],
      description: "ตอบกลับภายใน 24 ชั่วโมง"
    },
    {
      icon: <PhoneIcon className="w-6 h-6 text-green-500" />,
      title: "โทรศัพท์",
      details: ["+66 2-123-4567", "+66 81-234-5678"],
      description: "จันทร์-ศุกร์ 09:00-18:00 น."
    },
    {
      icon: <MapPinIcon className="w-6 h-6 text-blue-500" />,
      title: "ที่อยู่",
      details: ["123 ถนนสุขุมวิท", "แขวงคลองตัน เขตวัฒนา", "กรุงเทพฯ 10110"],
      description: "สำนักงานใหญ่"
    },
    {
      icon: <ClockIcon className="w-6 h-6 text-yellow-500" />,
      title: "เวลาทำการ",
      details: ["จันทร์-ศุกร์: 09:00-18:00", "เสาร์: 09:00-15:00", "อาทิตย์: ปิดทำการ"],
      description: "เวลาประเทศไทย"
    }
  ];

  const inquiryTypes = [
    { value: "general", label: "คำถามทั่วไป" },
    { value: "payment", label: "การชำระเงิน" },
    { value: "technical", label: "ปัญหาทางเทคนิค" },
    { value: "partnership", label: "การเป็นพาร์ทเนอร์" },
    { value: "other", label: "อื่นๆ" }
  ];

  // Base input classes
  const baseInputClasses = "bg-white px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-zinc-950 placeholder-zinc-400";
  const errorInputClasses = "border-red-500";
  const normalInputClasses = "border-zinc-300";

  // Custom FormField wrapper with correct styling for contact form
  const ContactFormField = ({ 
    id, 
    label, 
    error, 
    required = false, 
    children 
  }: {
    id: string;
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
  }) => {
    const fieldId = `${id}-input`;
    return (
      <div className="space-y-2">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-zinc-950"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        <div>
          {children}
        </div>
        {error && (
          <p
            id={`${id}-error`}
            className="flex items-center gap-1 mt-1 text-sm text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  };

  // Helper component for text inputs
  const TextInput = ({ 
    id, 
    name, 
    type = "text", 
    label, 
    placeholder, 
    required = false,
    value,
    error 
  }: {
    id: string;
    name: string;
    type?: string;
    label: string;
    placeholder: string;
    required?: boolean;
    value: string;
    error?: string;
  }) => (
    <ContactFormField
      id={id}
      label={label}
      error={error}
      required={required}
    >
      <input
        type={type}
        id={`${id}-input`}
        name={name}
        value={value}
        onChange={handleInputChange}
        className={cn(
          baseInputClasses,
          error ? errorInputClasses : normalInputClasses
        )}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </ContactFormField>
  );

  // Helper component for select
  const SelectInput = ({ 
    id, 
    name, 
    label, 
    required = false,
    value,
    options 
  }: {
    id: string;
    name: string;
    label: string;
    required?: boolean;
    value: string;
    options: Array<{ value: string; label: string }>;
  }) => (
    <ContactFormField
      id={id}
      label={label}
      required={required}
    >
      <select
        id={`${id}-input`}
        name={name}
        value={value}
        onChange={handleInputChange}
        className={cn(baseInputClasses, normalInputClasses)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </ContactFormField>
  );

  // Helper component for textarea
  const TextareaInput = ({ 
    id, 
    name, 
    label, 
    placeholder, 
    required = false,
    value,
    error,
    rows = 6
  }: {
    id: string;
    name: string;
    label: string;
    placeholder: string;
    required?: boolean;
    value: string;
    error?: string;
    rows?: number;
  }) => (
    <ContactFormField
      id={id}
      label={label}
      error={error}
      required={required}
    >
      <textarea
        id={`${id}-input`}
        name={name}
        value={value}
        onChange={handleInputChange}
        rows={rows}
        className={cn(
          baseInputClasses,
          error ? errorInputClasses : normalInputClasses
        )}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </ContactFormField>
  );

  return (
    <div className="bg-zinc-100 text-zinc-950 min-h-screen">
      <PageHeader 
        title="ติดต่อเรา" 
        description="เราพร้อมให้ความช่วยเหลือและตอบคำถามทุกข้อสงสัย"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-12 grid grid-cols-1 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="space-y-8 lg:col-span-1">
            <div>
              <h2 className="mb-6 font-semibold text-2xl">ข้อมูลติดต่อ</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-lg">{info.title}</h3>
                      <div className="space-y-1">
                        {info.details.map((detail, detailIndex) => (
                          <p key={detailIndex} className="text-zinc-950">{detail}</p>
                        ))}
                      </div>
                      <p className="mt-2 text-zinc-700 text-sm">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="mb-4 font-semibold text-lg">ติดตามเรา</h3>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="bg-zinc-100 hover:bg-zinc-600 p-3  transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="bg-zinc-100 hover:bg-zinc-600 p-3  transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H7.83c-.49 0-.875.385-.875.875v7.83c0 .49.385.875.875.875h8.449c.49 0 .875-.385.875-.875v-7.83c0-.49-.385-.875-.875-.875z"/>
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="bg-zinc-100 hover:bg-zinc-600 p-3  transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-100 text-zinc-950 p-8 ">
              <h2 className="mb-6 font-semibold text-2xl">ส่งข้อความถึงเรา</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <TextInput
                    id="name"
                    name="name"
                    type="text"
                    label="ชื่อ-นามสกุล"
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                    value={formData.name}
                    error={errors.name}
                  />
                  <TextInput
                    id="email"
                    name="email"
                    type="email"
                    label="อีเมล"
                    placeholder="กรอกอีเมล"
                    required
                    value={formData.email}
                    error={errors.email}
                  />
                </div>

                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <TextInput
                    id="phone"
                    name="phone"
                    type="tel"
                    label="เบอร์โทรศัพท์"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    value={formData.phone}
                    error={errors.phone}
                  />
                  <SelectInput
                    id="inquiryType"
                    name="inquiryType"
                    label="ประเภทคำถาม"
                    required
                    value={formData.inquiryType}
                    options={inquiryTypes}
                  />
                </div>

                <TextInput
                  id="subject"
                  name="subject"
                  type="text"
                  label="หัวข้อ"
                  placeholder="กรอกหัวข้อ"
                  required
                  value={formData.subject}
                  error={errors.subject}
                />

                <TextareaInput
                  id="message"
                  name="message"
                  label="ข้อความ"
                  placeholder="กรอกรายละเอียดข้อความ"
                  required
                  value={formData.message}
                  error={errors.message}
                  rows={6}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex justify-center items-center gap-2 bg-brand-primary hover:bg-red-600 disabled:bg-zinc-600 px-6 py-3 w-full font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  aria-label="ส่งข้อความติดต่อ"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="xs" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      ส่งข้อความ
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <ContactMap 
            address="123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ 10110"
            latitude={13.7300}
            longitude={100.5680}
          />
        </div>
      </div>
    </div>
  );
}
