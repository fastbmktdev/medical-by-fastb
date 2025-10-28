"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/database/supabase/client";
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import AuthLayout from "@/components/shared/layout/AuthLayout";
import { Button } from "@/components/shared";

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
      } catch {
        // Error occurred during login
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
          // RPC Error occurred
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
    } catch {
      // Login error occurred
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
    <AuthLayout
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับสู่ Muay Thai Community"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pr-6">
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-500/20 p-4 border border-red-500 rounded-lg">
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
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
                  className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                    errors.identifier ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
                  } rounded-xl px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
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
            <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                    errors.password ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                  } rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  onClick={togglePasswordVisibility}
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 hover:text-zinc-300 p-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </Button>
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
            href="/forget-password"
            className="text-red-500 hover:text-red-400 text-sm transition-colors"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingText="กำลังเข้าสู่ระบบ..."
          rightIcon={<ArrowRightIcon className="w-5 h-5" />}
          fullWidth
          size="lg"
        >
          เข้าสู่ระบบ
        </Button>
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

    </AuthLayout>
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
