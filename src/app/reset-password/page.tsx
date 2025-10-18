"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

/**
 * Interface for reset password form data
 */
interface ResetPasswordFormData {
  email: string;
}

/**
 * Interface for form validation errors
 */
interface FormErrors {
  email?: string;
  general?: string;
}

/**
 * Reset Password Page Component
 * Allows users to request a password reset link via email
 * 
 * Features:
 * - Email validation
 * - Password reset email sending
 * - Success confirmation
 * - Error handling
 * - Link back to login
 */
export default function ResetPasswordPage() {
  // Supabase client instance
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: "",
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Validate form inputs
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input field changes
   * Clears error for the field being edited
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   * Sends password reset email via Supabase
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (error) {
        // Handle errors
        if (error.message.includes("rate limit")) {
          setErrors({
            general: "คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
        return;
      }

      // Success
      setIsSuccess(true);
    } catch {
      setErrors({
        general: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Success screen after sending reset email
   */
  if (isSuccess) {
    return (
      <div className="container">
        <div className="w-full max-w-md">
          <div className="bg-zinc-800 shadow-2xl p-8 rounded-2xl text-center">
            <div className="flex justify-center mb-6">
              <CheckCircleIcon className="w-24 h-24 text-green-500" />
            </div>
            <h1 className="mb-4 font-bold text-white text-3xl">
              ส่งอีเมลสำเร็จ!
            </h1>
            <p className="mb-2 text-zinc-300 text-lg">
              เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง
            </p>
            <p className="mb-6 font-mono text-white">{formData.email}</p>
            <div className="bg-blue-500/20 mb-6 p-4 border border-blue-500 rounded-lg">
              <p className="text-blue-400 text-sm">
                💡 กรุณาตรวจสอบอีเมลและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
                <br />
                (ตรวจสอบในโฟลเดอร์ Spam หากไม่พบ)
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            >
              กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="space-y-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 font-bold text-white text-4xl">
            รีเซ็ตรหัสผ่าน
          </h1>
          <p className="text-zinc-400 text-lg">
            กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-zinc-800 shadow-2xl p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-500/20 p-4 border-2 border-red-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="flex-shrink-0 w-6 h-6 text-red-400" />
                  <p className="text-red-400 text-sm">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-zinc-700 p-4 border border-zinc-600 rounded-lg">
              <p className="text-zinc-300 text-sm">
                📧 กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                อีเมล
              </label>
              <div className="relative">
                <EnvelopeIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.email ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center items-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 shadow-lg px-8 py-4 rounded-lg w-full font-bold text-white text-lg transition-all disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="border-2 border-white border-t-transparent rounded-full w-6 h-6 animate-spin"></div>
                  กำลังส่งอีเมล...
                </>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-semibold text-red-500 hover:text-red-400 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-zinc-500 text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/signup"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

