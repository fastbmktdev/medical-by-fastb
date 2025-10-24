"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/database/supabase/client";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  AtSymbolIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

/**
 * Interface for signup form data
 */
interface SignupFormData {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

/**
 * Interface for form validation errors
 */
interface FormErrors {
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  referralCode?: string;
  general?: string;
}

/**
 * Signup Page Component
 * Allows new users to create an account using Supabase Auth
 *
 * Features:
 * - Username/Email/password registration
 * - Full name capture
 * - Password confirmation
 * - Form validation
 * - Error handling
 * - Email confirmation flow
 * - Auto-redirect if already authenticated
 * - Password visibility toggle
 * - Password strength indicator
 */
export default function SignupPage() {
  // Router for navigation
  const router = useRouter();

  // Supabase client instance
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * Check if user is already authenticated
   * If yes, redirect to homepage
   */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // User is already logged in, redirect them
          router.push("/");
        }
      } catch {
        // Silently handle errors
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [supabase, router]);

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
    }
  }, []);

  /**
   * Get password strength indicator
   * @param password - Password to check
   * @returns Strength level and color
   */
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: "", color: "" };
    if (password.length < 6) return { level: "อ่อน", color: "text-red-400" };
    if (password.length < 10) return { level: "ปานกลาง", color: "text-yellow-400" };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: "แข็งแรง", color: "text-green-400" };
    }
    return { level: "ปานกลาง", color: "text-yellow-400" };
  };

  /**
   * Validate form inputs
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "กรุณากรอก Username";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username ต้องมีอย่างน้อย 3 ตัวอักษร";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username ต้องประกอบด้วย ตัวอักษร ตัวเลข และ _ เท่านั้น";
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (!/^(0[6-9])\d{8}$/.test(formData.phone)) {
      newErrors.phone = "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (formData.password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
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
   * Creates new user account with Supabase and shows confirmation message
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
      // Check if username already exists
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username);

      // Ignore "no rows" error as it means username is available
      if (existingProfiles && existingProfiles.length > 0) {
        setErrors({
          username: "Username นี้ถูกใช้งานแล้ว",
        });
        setIsLoading(false);
        return;
      }

      // Attempt to sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.fullName,
            phone: formData.phone,
          },
          // Email confirmation URL
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Handle signup errors
        if (error.message.includes("already registered")) {
          setErrors({
            email: "อีเมลนี้ถูกใช้งานแล้ว",
          });
        } else if (error.message.includes("Password should be")) {
          setErrors({
            password: "รหัสผ่านไม่ตรงตามเงื่อนไข",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          setErrors({
            general: "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ",
          });
          return;
        }

        // Signup successful - Get user role and redirect to appropriate dashboard
        // Note: profile and user_role are created automatically by database trigger
        try {
          // Wait a bit for the trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Process referral code if provided
          if (formData.referralCode.trim()) {
            try {
              const response = await fetch('/api/affiliate/validate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: formData.referralCode }),
              });

              if (response.ok) {
                // Award referral points to the referrer
                await fetch('/api/affiliate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    referredUserId: data.user.id,
                    referralCode: formData.referralCode,
                  }),
                });
              }
            } catch (error) {
              console.error('Error processing referral:', error);
              // Don't fail the signup if referral processing fails
            }
          }

          // Fetch user role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();

          // Redirect based on role
          if (roleData?.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (roleData?.role === 'partner') {
            router.push('/partner/dashboard');
          } else {
            // Default to user dashboard or home
            router.push('/dashboard');
          }
        } catch {
          // If role fetch fails, redirect to home
          router.push('/');
        }
      }
    } catch {
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
   * Toggle confirm password visibility
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="container">
      <div className="space-y-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 font-bold text-white text-4xl">
            สมัครสมาชิก
          </h1>
        </div>

        {/* Signup Form */}
        <div className="bg-zinc-950 shadow-2xl p-8 rounded-2xl">
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

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                Username
              </label>
              <div className="relative">
                <AtSymbolIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.username ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                  placeholder="john_doe123"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Full Name Field */}
            <div>
              <label
                htmlFor="fullName"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <UserIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.fullName ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="สมชาย ใจดี"
                  autoComplete="name"
                />
              </div>
              {errors.fullName && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
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

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <DevicePhoneMobileIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.phone ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                  placeholder="0812345678"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.phone}
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
                  autoComplete="new-password"
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
              {formData.password && !errors.password && (
                <p className={`mt-2 text-sm ${passwordStrength.color}`}>
                  ความแข็งแรง: {passwordStrength.level}
                </p>
              )}
              {errors.password && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2 font-medium text-zinc-300 text-sm"
              >
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <LockClosedIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.confirmPassword ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="top-3.5 right-3 absolute focus:outline-none text-zinc-500 hover:text-zinc-400"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Referral Code Field */}
            <div className="space-y-2">
              <label
                htmlFor="referralCode"
                className="block text-zinc-300 text-sm font-medium"
              >
                โค้ดแนะนำ (ไม่บังคับ)
              </label>
              <div className="relative">
                <AtSymbolIcon className="w-5 h-5 absolute left-3 top-3.5 text-zinc-500" />
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  className={`w-full bg-zinc-700 border ${
                    errors.referralCode ? "border-red-500" : "border-zinc-600"
                  } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="MT12345678"
                />
              </div>
              {errors.referralCode && (
                <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {errors.referralCode}
                </p>
              )}
              {formData.referralCode && (
                <p className="text-green-400 text-sm">
                  🎁 คุณจะได้รับสิทธิพิเศษเมื่อใช้โค้ดแนะนำ!
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
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/login"
                className="font-semibold text-red-500 hover:text-red-400 transition-colors"
              >
                เข้าสู่ระบบ
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
