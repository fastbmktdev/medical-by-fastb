"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { createClient } from "@shared/lib/database/supabase/client";
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button } from "@/components/shared";
import {
  signInWithGoogle,
  signInWithFacebook,
} from "@shared/services/auth.service";
import { toast } from "react-hot-toast";
import { Loading } from "@/components/design-system/primitives/Loading";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  // Show error message from URL parameter
  useEffect(() => {
    if (errorParam === "session_expired") {
      setErrors({
        general: "Session หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
      });
    } else if (errorParam === "no_role") {
      setErrors({
        general:
          "บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
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
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const loginPaths = ["/login", "/signin", "/auth/login"];
          const currentPath =
            typeof window !== "undefined" ? window.location.pathname : "";

          let redirectTarget = redirectTo || "/";
          if (loginPaths.some((path) => redirectTarget.startsWith(path))) {
            redirectTarget = "/";
          }

          if (redirectTarget !== currentPath) {
            router.replace(redirectTarget);
          }
        }
      } catch {
        // Silently ignore auth check errors
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [supabase, router, redirectTo]);

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
        : (formData[fieldName as keyof LoginFormData] as string);

    switch (fieldName) {
      case "identifier":
        if (!val.trim()) {
          return "กรุณากรอกอีเมลหรือ Username";
        }
        return "";

      case "password":
        if (!val) {
          return "กรุณากรอกรหัสผ่าน";
        } else if (val.length < 6) {
          return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
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
    const fieldsToValidate: (keyof FormErrors)[] = ["identifier", "password"];

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
        try {
          const { data: userData, error: rpcError } = await supabase.rpc(
            "get_user_by_username_or_email",
            { identifier: formData.identifier }
          );

          if (rpcError) {
            // Check if it's a network error
            if (
              rpcError.message.includes("fetch") ||
              rpcError.message.includes("Failed to fetch")
            ) {
              setErrors({
                general:
                  "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
              });
            } else {
              setErrors({
                general: `เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ${rpcError.message}`,
              });
            }
            setIsLoading(false);
            return;
          }

          if (!userData || userData.length === 0) {
            setErrors({
              general:
                "ไม่พบผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบ Username หรืออีเมลของคุณ",
            });
            setIsLoading(false);
            return;
          }

          email = userData[0].email;
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
          setErrors({
            general:
              message.includes("fetch") || message.includes("Failed to fetch")
                ? "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
                : `เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ${message}`,
          });
          setIsLoading(false);
          return;
        }
      }

      // Attempt to sign in with Supabase
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });

        if (error) {
          // Handle authentication errors
          if (
            error.message.includes("Invalid login credentials") ||
            error.message.includes("Invalid credentials")
          ) {
            setErrors({
              general:
                "อีเมล, Username หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
            });
          } else if (error.message.includes("Email not confirmed")) {
            setErrors({
              general: "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ",
            });
          } else if (
            error.message.includes("fetch") ||
            error.message.includes("Failed to fetch") ||
            error.status === null
          ) {
            setErrors({
              general:
                "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
            });
          } else {
            setErrors({
              general: `เกิดข้อผิดพลาด: ${error.message}${error.status ? ` (Status: ${error.status})` : ""}`,
            });
          }
          setIsLoading(false);
          return;
        }

        if (data.session) {
          // Login successful, redirect to intended page
          router.push(redirectTo);
          router.refresh(); // Refresh to update server components
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        const name = err instanceof Error ? err.name : "";
        const causeCode =
          typeof err === "object" &&
          err !== null &&
          "cause" in err &&
          (err as { cause?: { code?: string } }).cause
            ? (err as { cause?: { code?: string } }).cause?.code
            : undefined;

        // Check if it's a fetch error
        if (
          message.includes("fetch") ||
          message.includes("Failed to fetch") ||
          name === "TypeError" ||
          causeCode === "ECONNREFUSED" ||
          causeCode === "ENOTFOUND"
        ) {
          setErrors({
            general:
              "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${message || "Unknown error"}`,
          });
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง";
      // Unknown error occurred
      setErrors({
        general: `เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ: ${message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrors((prev) => ({ ...prev, general: undefined }));
      await signInWithGoogle();
      // Redirect handled by Supabase OAuth flow
    } catch (error: unknown) {
      console.error("Google sign-in failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "ไม่สามารถเข้าสู่ระบบด้วย Google ได้";
      toast.error(message, { duration: 3000 });
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsFacebookLoading(true);
      setErrors((prev) => ({ ...prev, general: undefined }));
      await signInWithFacebook();
    } catch (error: unknown) {
      console.error("Facebook sign-in failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "ไม่สามารถเข้าสู่ระบบด้วย Facebook ได้";
      toast.error(message, { duration: 3000 });
      setIsFacebookLoading(false);
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
      <div className="flex justify-center items-center bg-white text-zinc-950 min-h-screen">
        <div className="text-center space-y-4">
          <Loading centered size="xl" />
          <p className="text-zinc-950 text-lg">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับสู่ Medical Community"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={isGoogleLoading}
            loadingText="กำลังเชื่อมต่อ Google..."
            leftIcon={
              <span className="flex items-center justify-center w-4 h-4 text-white">
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 10.8v3.84h5.44c-.24 1.44-1.6 4.24-5.44 4.24-3.28 0-5.96-2.72-5.96-6.08s2.68-6.08 5.96-6.08c1.88 0 3.16.8 3.88 1.48l2.64-2.56C16.72 3.68 14.56 2.8 12 2.8 6.88 2.8 2.8 6.88 2.8 12s4.08 9.2 9.2 9.2c5.32 0 8.84-3.72 8.84-8.96 0-.6-.04-1.04-.12-1.44H12z"
                  />
                </svg>
              </span>
            }
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isFacebookLoading}
          >
            เข้าสู่ระบบด้วย Google
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={isFacebookLoading}
            loadingText="กำลังเชื่อมต่อ Facebook..."
            leftIcon={
              <span className="flex items-center justify-center w-4 h-4">
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path
                    fill="#1877F2"
                    d="M22 12a10 10 0 1 0-11.562 9.875v-6.988H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33v6.988A10.001 10.001 0 0 0 22 12Z"
                  />
                </svg>
              </span>
            }
            onClick={handleFacebookSignIn}
            disabled={isFacebookLoading || isGoogleLoading}
          >
            เข้าสู่ระบบด้วย Facebook
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs uppercase tracking-wide text-gray-600">
              หรือเข้าสู่ระบบด้วยอีเมล
            </span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-500/20 p-4 border border-red-500 ">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="shrink-0 w-6 h-6 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm whitespace-pre-line">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email or Username Field */}
        <div>
          <label
            htmlFor="identifier"
            className="block mb-2 font-medium text-zinc-950 text-sm"
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
              onBlur={handleBlur}
              className={`w-full bg-white text-zinc-950 border ${
                errors.identifier
                  ? "border-red-500/70 shadow-red-500/20"
                  : "border-gray-300 hover:border-gray-400"
              }  px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
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
            className="block mb-2 font-medium text-zinc-950 text-sm"
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
              className={`w-full bg-white text-zinc-950 border ${
                errors.password
                  ? "border-red-500/70 shadow-red-500/20"
                  : "border-gray-300 hover:border-gray-400 group-hover:border-gray-400"
              }  px-4 py-3 pr-12 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Button
              type="button"
              onClick={togglePasswordVisibility}
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-600 hover:text-gray-800 p-1"
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
            className="text-violet-600 hover:text-violet-400 text-sm transition-colors"
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
          fullWidth
          size="lg"
        >
          เข้าสู่ระบบ
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/signup"
            className="font-semibold text-violet-600 hover:text-violet-400 transition-colors"
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
        <div className="flex justify-center items-center bg-white text-zinc-950 min-h-screen">
          <div className="text-center space-y-4">
            <Loading centered size="xl" />
            <p className="text-zinc-950 text-lg">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
