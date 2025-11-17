"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { createClient } from "@/lib/database/supabase/client";
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button } from "@/components/shared";
import toast from "react-hot-toast";
import { validatePasswordStrong } from "@/lib/utils/validation";
import { useReferralCode } from "@/contexts";
import { isValidReferralCodeFormat } from "@/lib/utils/affiliate";
import { Loading } from "@/components/design-system/primitives/Loading";

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
function SignupContent() {
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
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [_rateLimitHit, setRateLimitHit] = useState(false);

  /**
   * Check if user is already authenticated
   * If yes, redirect to homepage
   */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

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

  const searchParams = useSearchParams();
  const {
    referralCode: storedReferralCode,
    setReferralCode,
    clearReferralCode,
  } = useReferralCode();

  // Sync referral code from URL/context into form state
  useEffect(() => {
    let normalizedCode: string | null = null;
    const urlRef = searchParams?.get("ref");

    if (urlRef) {
      const candidate = urlRef.trim().toUpperCase();
      if (isValidReferralCodeFormat(candidate)) {
        normalizedCode = candidate;
        setReferralCode(candidate);
      }
    }

    if (!normalizedCode && storedReferralCode) {
      normalizedCode = storedReferralCode;
    }

    if (normalizedCode) {
      setFormData((prev) => {
        if (
          prev.referralCode === normalizedCode ||
          !normalizedCode ||
          normalizedCode === ""
        ) {
          return prev;
        }
        return {
          ...prev,
          referralCode: normalizedCode || "",
        };
      });
    }
  }, [searchParams, setReferralCode, storedReferralCode]);

  /**
   * Get password strength indicator
   * @param password - Password to check
   * @returns Strength level and color
   */
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: "", color: "" };

    // Check for all required character types
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const requiredTypesCount = [
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;

    if (password.length < 6) return { level: "อ่อน", color: "text-red-400" };
    if (password.length < 8 || requiredTypesCount < 2) {
      return { level: "ปานกลาง", color: "text-yellow-400" };
    }
    if (
      password.length >= 8 &&
      hasLower &&
      hasUpper &&
      hasNumber &&
      hasSpecial
    ) {
      return { level: "แข็งแรง", color: "text-green-400" };
    }
    return { level: "ปานกลาง", color: "text-yellow-400" };
  };

  /**
   * Validate individual field
   * @param fieldName - Name of the field to validate
   * @param value - Value to validate (optional, uses formData if not provided)
   * @returns Error message or empty string if valid
   */
  const validateField = (
    fieldName: keyof FormErrors,
    value?: string
  ): string => {
    const val =
      value !== undefined
        ? value
        : (formData[fieldName as keyof SignupFormData] as string);

    switch (fieldName) {
      case "username":
        if (!val.trim()) {
          return "กรุณากรอก Username";
        } else if (val.trim().length < 3) {
          return "Username ต้องมีอย่างน้อย 3 ตัวอักษร";
        } else if (!/^[a-zA-Z0-9_]+$/.test(val)) {
          return "Username ต้องประกอบด้วย ตัวอักษร ตัวเลข และ _ เท่านั้น";
        }
        return "";

      case "fullName":
        if (!val.trim()) {
          return "กรุณากรอกชื่อ-นามสกุล";
        } else if (val.trim().length < 2) {
          return "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
        }
        return "";

      case "phone":
        if (!val.trim()) {
          return "กรุณากรอกเบอร์โทรศัพท์";
        } else if (!/^(0[6-9])\d{8}$/.test(val)) {
          return "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)";
        }
        return "";

      case "email":
        if (!val.trim()) {
          return "กรุณากรอกอีเมล";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return "รูปแบบอีเมลไม่ถูกต้อง";
        }
        return "";

      case "password":
        return validatePasswordStrong(val, true) || "";

      case "confirmPassword":
        if (!val) {
          return "กรุณายืนยันรหัสผ่าน";
        } else if (formData.password !== val) {
          return "รหัสผ่านไม่ตรงกัน";
        }
        return "";

      default:
        return "";
    }
  };

  /**
   * Handle blur event for form fields
   * Validates the field when user leaves it
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormErrors;

    // Skip validation for empty optional fields
    if (fieldName === "referralCode") return;

    const error = validateField(fieldName, value);

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

  /**
   * Validate form inputs
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all fields
    const fieldsToValidate: (keyof FormErrors)[] = [
      "username",
      "fullName",
      "email",
      "phone",
      "password",
      "confirmPassword",
    ];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
      }
    });

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
        .from("profiles")
        .select("username")
        .eq("username", formData.username);

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
          // Email confirmation URL - use /api/auth/callback to avoid i18n middleware
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        // Handle specific error messages
        if (
          error.message.includes("already registered") ||
          error.message.includes("User already registered")
        ) {
          setErrors({
            email: "อีเมลนี้ถูกใช้งานแล้ว",
          });
        } else if (
          error.message.includes("Password should be") ||
          error.message.includes("password")
        ) {
          setErrors({
            password: "รหัสผ่านไม่ตรงตามเงื่อนไข",
          });
        } else if (
          error.message.includes("No API key found") ||
          error.message.includes("apikey")
        ) {
          // API key configuration error
          console.error("❌ Supabase API Key Error:", error);
          setErrors({
            general:
              "เกิดข้อผิดพลาดในการตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ (API key missing)",
          });
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("429") ||
          error.message.includes("Too Many Requests") ||
          error.message.includes("confirmation email")
        ) {
          // Rate limit or email sending error - use Resend fallback
          console.log("⚠️ Email sending issue detected, using Resend fallback");
          setRateLimitHit(true);

          // Send OTP via Resend
          const resendResponse = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              fullName: formData.fullName,
            }),
          });

          // Check for rate limit error (HTTP 429)
          if (resendResponse.status === 429) {
            const { checkRateLimitError, formatRateLimitMessageThai } =
              await import("@/lib/utils/rate-limit-error");
            const rateLimitError = await checkRateLimitError(resendResponse);

            if (rateLimitError) {
              setErrors({
                general: formatRateLimitMessageThai(rateLimitError),
              });
              return;
            }
          }

          if (resendResponse.ok) {
            setShowOTPModal(true);
          } else {
            const resendData = await resendResponse.json();
            setErrors({
              general:
                resendData.error ||
                "ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่อีกครั้ง",
            });
          }
        } else {
          // Log full error for debugging
          console.error("Signup error:", error);
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          setErrors({
            general: "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ",
          });
          setIsLoading(false);
          return;
        }

        // Track signup with Google Analytics
        try {
          const { trackUserSignup } = await import("@/lib/utils/analytics");
          const signupMethod = data.user.identities?.[0]?.provider || "email";
          trackUserSignup(data.user.id, signupMethod);
        } catch (error) {
          // Analytics error shouldn't break signup flow
          console.warn("Analytics tracking error:", error);
        }

        // Process referral code in background (don't block redirect)
        const normalizedFormCode = formData.referralCode.trim().toUpperCase();
        const referralCodeToProcess = (() => {
          if (
            normalizedFormCode &&
            isValidReferralCodeFormat(normalizedFormCode)
          ) {
            return normalizedFormCode;
          }
          return storedReferralCode;
        })();

        if (referralCodeToProcess && data.user) {
          const userId = data.user.id;
          // Process referral code asynchronously
          fetch("/api/affiliate/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: referralCodeToProcess }),
          })
            .then(async (response) => {
              if (response.ok) {
                await fetch("/api/affiliate", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    referredUserId: userId,
                    referralCode: referralCodeToProcess,
                  }),
                });
                clearReferralCode();
              }
            })
            .catch(() => {
              // Silently fail - don't block user flow
            });
        }

        // Redirect to verification pending page
        router.push(
          `/verification-pending?email=${encodeURIComponent(formData.email)}`
        );
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
   * Handle OTP verification
   */
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({
        general: "กรุณากรอกรหัส OTP 6 หลัก",
      });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp,
          username: formData.username,
          fullName: formData.fullName,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general: data.error || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ",
        });
        setIsVerifying(false);
        return;
      }

      // Process referral code if provided
      if (formData.referralCode.trim()) {
        try {
          const referralResponse = await fetch("/api/affiliate/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: formData.referralCode }),
          });

          if (referralResponse.ok) {
            await fetch("/api/affiliate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                referredUserId: data.data.user.id,
                referralCode: formData.referralCode,
              }),
            });
          }
        } catch {
          // Error processing referral
        }
      }

      // Redirect to dashboard
      router.push(`/dashboard`);
    } catch (error) {
      console.error("OTP verification error:", error);
      setErrors({
        general: "เกิดข้อผิดพลาดในการยืนยัน กรุณาลองใหม่อีกครั้ง",
      });
      setIsVerifying(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    setErrors({});

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
        }),
      });

      // Check for rate limit error (HTTP 429)
      if (response.status === 429) {
        const { checkRateLimitError, formatRateLimitMessageThai } =
          await import("@/lib/utils/rate-limit-error");
        const rateLimitError = await checkRateLimitError(response);

        if (rateLimitError) {
          toast.error(formatRateLimitMessageThai(rateLimitError));
          return;
        }
      }

      if (response.ok) {
        setErrors({
          general: "ส่งรหัส OTP ใหม่ให้แล้ว กรุณาตรวจสอบอีเมล",
        });
      } else {
        const data = await response.json();
        setErrors({
          general: data.error || "ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
    } catch {
      setErrors({
        general: "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  /**
   * Loading screen while checking authentication
   */
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
        <div className="text-center space-y-4">
          <Loading centered size="xl" />
          <p className="text-zinc-300 text-lg">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AuthLayout
      title="สมัครสมาชิก"
      subtitle="เข้าร่วมชุมชนนักมวยไทยที่ใหญ่ที่สุด"
    >
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-500/20 p-4 border border-red-500/70 shadow-red-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="shrink-0 w-6 h-6 text-red-400" />
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
            <div className="relative group">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.username
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-xl px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
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
            <div className="relative group">
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.fullName
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-xl px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 text-sm`}
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
            <div className="relative group">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.email
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-xl px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
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
            <div className="relative group">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.phone
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-xl px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
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
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.password
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-lg px-4 py-3 pr-12 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono`}
                placeholder="••••••••"
                autoComplete="new-password"
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

            {/* Password Requirements - Show always */}
            {!errors.password && (
              <div className="mt-2 space-y-1">
                {formData.password && (
                  <p className={`text-sm ${passwordStrength.color}`}>
                    ความแข็งแรง: {passwordStrength.level}
                  </p>
                )}
                <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs mb-2">รหัสผ่านต้องมี:</p>
                  <ul className="space-y-1 text-zinc-500 text-xs">
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          formData.password.length >= 8 ? "text-green-400" : ""
                        }
                      >
                        {formData.password.length >= 8 ? "✓" : "○"}
                      </span>
                      อย่างน้อย 8 ตัวอักษร
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          /[a-z]/.test(formData.password)
                            ? "text-green-400"
                            : ""
                        }
                      >
                        {/[a-z]/.test(formData.password) ? "✓" : "○"}
                      </span>
                      ตัวอักษรพิมพ์เล็ก (a-z)
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          /[A-Z]/.test(formData.password)
                            ? "text-green-400"
                            : ""
                        }
                      >
                        {/[A-Z]/.test(formData.password) ? "✓" : "○"}
                      </span>
                      ตัวอักษรพิมพ์ใหญ่ (A-Z)
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          /\d/.test(formData.password) ? "text-green-400" : ""
                        }
                      >
                        {/\d/.test(formData.password) ? "✓" : "○"}
                      </span>
                      ตัวเลข (0-9)
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                            formData.password
                          )
                            ? "text-green-400"
                            : ""
                        }
                      >
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                          formData.password
                        )
                          ? "✓"
                          : "○"}
                      </span>
                      อักขระพิเศษ (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>
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
            <div className="relative group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.confirmPassword
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-lg px-4 py-3 pr-12 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <Button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                variant="ghost"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 hover:text-zinc-300 p-1"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </Button>
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
            <div className="relative group">
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleInputChange}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.referralCode
                    ? "border-red-500/70 shadow-red-500/20"
                    : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
                } rounded-lg px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200`}
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
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              loadingText="กำลังสมัครสมาชิก..."
              fullWidth
              size="lg"
            >
              สมัครสมาชิก
            </Button>
          </div>
        </form>
        {/* Login Link */}
      </div>
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

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ยืนยันอีเมลของคุณ
              </h2>
              <p className="text-zinc-400 text-sm">
                เราได้ส่งรหัส OTP ไปยัง <br />
                <span className="font-semibold text-white">
                  {formData.email}
                </span>
              </p>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="mb-4 bg-red-500/20 p-3 border border-red-500/70 rounded-lg">
                <p className="text-red-400 text-sm text-center">
                  {errors.general}
                </p>
              </div>
            )}

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block mb-2 font-medium text-zinc-300 text-sm">
                รหัส OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-zinc-800/50 border border-zinc-600 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70"
                placeholder="000000"
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || isVerifying}
                loading={isVerifying}
                loadingText="กำลังยืนยัน..."
                fullWidth
                size="lg"
              >
                ยืนยัน
              </Button>
              <Button
                onClick={handleResendOTP}
                variant="ghost"
                fullWidth
                size="lg"
              >
                ส่งรหัสใหม่
              </Button>
              <Button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtp("");
                  setErrors({});
                }}
                variant="ghost"
                fullWidth
                size="lg"
              >
                ยกเลิก
              </Button>
            </div>

            {/* Info */}
            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-xs">
                ⏰ รหัส OTP จะหมดอายุใน 10 นาที
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

function SignupSuspenseFallback() {
  return (
    <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
      <div className="text-center space-y-4">
        <Loading centered size="xl" />
        <p className="text-zinc-300 text-lg">กำลังโหลดแบบฟอร์มสมัครสมาชิก...</p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSuspenseFallback />}>
      <SignupContent />
    </Suspense>
  );
}
