"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/database/supabase/client";
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

/**
 * Interface for forget password form data
 */
interface ForgetPasswordFormData {
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
 * Interface for token information
 */
interface TokenInfo {
  token: string | null;
  type: string | null;
  access_token: string | null;
  refresh_token: string | null;
}

/**
 * Component that handles search params for token information
 */
function TokenHandler({ 
  onTokenInfo, 
  onShowTokenInfo 
}: { 
  onTokenInfo: (info: TokenInfo) => void;
  onShowTokenInfo: (show: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');

    if (token || type || access_token || refresh_token) {
      onTokenInfo({
        token,
        type,
        access_token,
        refresh_token,
      });
      onShowTokenInfo(true);
      
      // Log token information to console for debugging
      console.log('🔑 Password Reset Token Information:');
      console.log('Token:', token);
      console.log('Type:', type);
      console.log('Access Token:', access_token);
      console.log('Refresh Token:', refresh_token);
      console.log('Full URL:', window.location.href);
      console.log('Search Params:', Object.fromEntries(searchParams.entries()));
    }
  }, [searchParams, onTokenInfo, onShowTokenInfo]);

  return null;
}

/**
 * Forget Password Page Component
 * Allows users to request a password reset link via email
 * 
 * Features:
 * - Email validation
 * - Password reset email sending
 * - Success confirmation
 * - Error handling
 * - Link back to login
 */
function ForgetPasswordPageContent() {
  // Supabase client instance
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState<ForgetPasswordFormData>({
    email: "",
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    token: null,
    type: null,
    access_token: null,
    refresh_token: null,
  });
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  // Token info handlers
  const handleTokenInfo = (info: TokenInfo) => {
    setTokenInfo(info);
  };

  const handleShowTokenInfo = (show: boolean) => {
    setShowTokenInfo(show);
  };

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
      // Debug: Log environment variables and Supabase client info
      console.log('🔍 Debug Info:');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('Current origin:', window.location.origin);
      console.log('Redirect URL:', `${window.location.origin}/reset-password`);

      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // Send password reset email
      console.log('📧 Sending password reset email to:', formData.email);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      console.log('📧 Password reset response:', { data, error });

      if (error) {
        console.error('❌ Password reset error:', error);
        
        // Handle specific errors
        if (error.message.includes("rate limit")) {
          setErrors({
            general: "คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
          });
        } else if (error.message.includes("Invalid email")) {
          setErrors({
            general: "อีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
          });
        } else if (error.message.includes("User not found")) {
          setErrors({
            general: "ไม่พบผู้ใช้ที่ใช้อีเมลนี้ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
        return;
      }

      // Success
      console.log('✅ Password reset email sent successfully');
      setIsSuccess(true);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setErrors({
            general: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่",
          });
        } else if (error.message.includes('Missing Supabase environment variables')) {
          setErrors({
            general: "การตั้งค่าระบบไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
      } else {
        setErrors({
          general: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Success screen after sending reset email
   */
  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh_-_132px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl text-center">
            <div className="flex justify-center mb-6">
              <CheckCircleIcon className="w-20 h-20 text-green-500" />
            </div>
            <h1 className="mb-4 font-bold text-white text-2xl">
              ส่งอีเมลสำเร็จ!
            </h1>
            <p className="mb-2 text-zinc-300 text-base">
              เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง
            </p>
            <p className="mb-6 font-mono text-white text-sm">{formData.email}</p>
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
    <div className="min-h-[calc(100vh_-_132px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Token Handler */}
        <Suspense fallback={null}>
          <TokenHandler 
            onTokenInfo={handleTokenInfo}
            onShowTokenInfo={handleShowTokenInfo}
          />
        </Suspense>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="mb-2 font-bold text-white text-3xl">
            ลืมรหัสผ่าน
          </h1>
          <p className="text-zinc-400 text-base">
            กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
          </p>
        </div>

        {/* Token Information Display (for testing) */}
        {showTokenInfo && (
          <div className="mb-6 bg-blue-500/20 border border-blue-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <KeyIcon className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-blue-400">🔍 Token Debug Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-300 font-medium">Token:</span>
                <span className="ml-2 font-mono text-white break-all">
                  {tokenInfo.token || 'null'}
                </span>
              </div>
              <div>
                <span className="text-blue-300 font-medium">Type:</span>
                <span className="ml-2 font-mono text-white">
                  {tokenInfo.type || 'null'}
                </span>
              </div>
              <div>
                <span className="text-blue-300 font-medium">Access Token:</span>
                <span className="ml-2 font-mono text-white break-all">
                  {tokenInfo.access_token ? `${tokenInfo.access_token.substring(0, 20)}...` : 'null'}
                </span>
              </div>
              <div>
                <span className="text-blue-300 font-medium">Refresh Token:</span>
                <span className="ml-2 font-mono text-white break-all">
                  {tokenInfo.refresh_token ? `${tokenInfo.refresh_token.substring(0, 20)}...` : 'null'}
                </span>
              </div>
              <div className="pt-2 border-t border-blue-500/30">
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-300 font-medium">Current URL:</span>
                    <div className="ml-2 font-mono text-white text-xs break-all">
                      {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
                    </div>
                  </div>
                  <div>
                    <span className="text-green-400 text-xs">
                      ✅ Token received successfully! Check console for full details.
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-400 text-xs">
                      📝 This debug panel will only show when token parameters are present in URL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forget Password Form */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-500/20 p-4 border border-red-500 rounded-lg">
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
                  <div className="border border-white border-t-transparent rounded-full w-6 h-6 animate-spin"></div>
                  กำลังส่งอีเมล...
                </>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-4 text-center">
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
        <div className="text-center mt-4">
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

/**
 * Main export with Suspense boundary
 */
export default function ForgetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh_-_132px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-zinc-300">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    }>
      <ForgetPasswordPageContent />
    </Suspense>
  );
}
