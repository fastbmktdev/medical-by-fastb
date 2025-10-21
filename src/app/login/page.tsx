"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/database/supabase/client";
import {
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

/**
 * Interface for login form data
 */
interface LoginFormData {
  identifier: string; // Can be email or username
  password: string;
}

/**
 * Interface for form validation errors
 */
interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

/**
 * Login Form Component
 * Internal component that handles the actual login logic
 */
function LoginForm() {
  // Router for navigation
  const router = useRouter();

  // Get search params for redirect
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const errorParam = searchParams.get("error");

  // Supabase client instance
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: "",
    password: "",
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Show error message from URL parameter
  useEffect(() => {
    if (errorParam === 'session_expired') {
      setErrors({
        general: 'Session หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
      });
    } else if (errorParam === 'no_role') {
      setErrors({
        general: 'บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
      });
    }
  }, [errorParam]);

  /**
   * Check if user is already authenticated
   * If yes, redirect to the intended destination
   */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // User is already logged in, redirect them
          router.push(redirectTo);
        }
      } catch (error) {
        console.log(error);
        // Silently handle errors
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [supabase, router, redirectTo]);

  /**
   * Validate form inputs
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Identifier validation (email or username)
    if (!formData.identifier.trim()) {
      newErrors.identifier = "กรุณากรอกอีเมลหรือ Username";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (formData.password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
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
   * Authenticates user with Supabase and redirects on success
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
      // Check if identifier is an email or username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier);

      let email = formData.identifier;

      // If not an email, look up the email from username using RPC function
      if (!isEmail) {
        const { data: userData, error: rpcError } = await supabase
          .rpc('get_user_by_username_or_email', { identifier: formData.identifier });

        if (rpcError) {
          console.error('RPC Error:', rpcError);
          setErrors({
            general: `เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ${rpcError.message}`,
          });
          setIsLoading(false);
          return;
        }

        if (!userData || userData.length === 0) {
          setErrors({
            general: "ไม่พบผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบ Username หรืออีเมลของคุณ",
          });
          setIsLoading(false);
          return;
        }

        email = userData[0].email;
      }

      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        // Handle authentication errors
        if (error.message.includes("Invalid login credentials")) {
          setErrors({
            general: "อีเมล, Username หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
          });
        } else if (error.message.includes("Email not confirmed")) {
          setErrors({
            general: "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
        return;
      }

      if (data.session) {
        // Login successful, redirect to intended page
        router.push(redirectTo);
        router.refresh(); // Refresh to update server components
      }
    } catch (error) {
      console.log(error)
      setErrors({
        general: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Loading screen while checking authentication
   */
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-red-600 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          <p className="text-zinc-300 text-lg">กำลังตรวจสอบ...</p>
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
            เข้าสู่ระบบ
          </h1>
          <p className="text-zinc-400 text-lg">
            ยินดีต้อนรับกลับมา
          </p>
        </div>

        {/* Login Form */}
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

            {/* Email or Username Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                อีเมลหรือ Username
              </label>
              <div className="relative">
                <EnvelopeIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.identifier ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                  placeholder="your@email.com or username"
                  autoComplete="username"
                />
              </div>
              {errors.identifier && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <LockClosedIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.password ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="top-3.5 right-3 absolute focus:outline-none text-zinc-500 hover:text-zinc-400"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-red-500 hover:text-red-400 text-sm transition-colors"
              >
                ลืมรหัสผ่าน?
              </Link>
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
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/signup"
                className="font-semibold text-red-500 hover:text-red-400 transition-colors"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-400 text-sm transition-colors"
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Login Page Component
 * Allows users to authenticate with email/username and password using Supabase Auth
 *
 * Features:
 * - Email or Username/password authentication
 * - Form validation
 * - Error handling
 * - Redirect to previous page or dashboard after login
 * - Auto-redirect if already authenticated
 * - Password visibility toggle
 * - Link to signup and password reset
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
          <div className="text-center">
            <div className="inline-block mb-4 border-4 border-red-600 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
            <p className="text-zinc-300 text-lg">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
