"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/database/supabase/client";
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button } from "@/components/shared";

/**
 * Interface for update password form data
 */
interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Interface for form validation errors
 */
interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Update Password Form Component
 * Internal component that handles the actual password update logic
 */
function UpdatePasswordForm() {
  // Router for navigation
  const router = useRouter();

  // Get search params for redirect and messages
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const message = searchParams.get("message");

  // Supabase client instance
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState<UpdatePasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * Check if user is authenticated and has a valid session
   * If not, redirect to login
   */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // User is not authenticated, redirect to login
          router.push("/login?redirect=/update-password");
        } else {
          // Check if this is a password reset session
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.app_metadata?.provider === 'email') {
            // This is likely a password reset session
            console.log('Password reset session detected');
          }
        }
      } catch {
        // Error occurred during authentication check
        router.push("/login?redirect=/update-password");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [supabase, router]);

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

    // Password validation
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่านใหม่";
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
   * Updates user password with Supabase and redirects on success
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
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        // Handle password update errors
        if (error.message.includes("Password should be")) {
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

      // Password update successful
      setIsSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(redirectTo);
      }, 3000);
    } catch {
      // Password update error occurred
      setErrors({
        general: "เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน กรุณาลองใหม่อีกครั้ง",
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

  /**
   * Success screen after password update
   */
  if (isSuccess) {
    return (
      <AuthLayout
        title="อัปเดตรหัสผ่านสำเร็จ!"
        subtitle="รหัสผ่านของคุณได้รับการอัปเดตแล้ว"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500" />
          </div>
          <p className="mb-6 text-zinc-300 text-base">
            รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว
            <br />
            กำลังนำคุณไปยังหน้าแดชบอร์ด...
          </p>
          <div className="bg-green-500/20 mb-6 p-4 border border-green-500 rounded-lg">
            <p className="text-green-400 text-sm">
              ✅ คุณสามารถใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งต่อไป
            </p>
          </div>
          <Button
            asChild
            variant="primary"
            size="lg"
          >
            <Link href={redirectTo}>
              ไปยังแดชบอร์ด
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AuthLayout
      title="อัปเดตรหัสผ่าน"
      subtitle="กรอกรหัสผ่านใหม่ที่ปลอดภัย"
    >
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

        {/* Success Message for Password Reset */}
        {message === 'password_reset_success' && (
          <div className="bg-green-500/20 p-4 border border-green-500 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="flex-shrink-0 w-6 h-6 text-green-400" />
              <p className="text-green-400 text-sm">
                ✅ ลิงก์รีเซ็ตรหัสผ่านถูกต้อง กรุณากรอกรหัสผ่านใหม่
              </p>
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="bg-blue-500/20 p-4 border border-blue-500 rounded-lg">
          <p className="text-blue-400 text-sm">
            🔒 กรุณากรอกรหัสผ่านใหม่ที่ปลอดภัยและจำง่าย
          </p>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            รหัสผ่านใหม่
          </label>
            <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full bg-zinc-700 border ${
                errors.password ? "border-red-500" : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
              } rounded-lg px-4 py-2.5 pr-10 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm`}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <Button
              type="button"
              onClick={togglePasswordVisibility}
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-4text-zinc-400 hover:text-zinc-300 p-1"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </Button>
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
            ยืนยันรหัสผ่านใหม่
          </label>
            <div className="relative group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full bg-zinc-700 border ${
                errors.confirmPassword ? "border-red-500" : "border-zinc-600/50 hover:border-zinc-500/70 group-hover:border-zinc-500/50"
              } rounded-lg px-4 py-3 pr-10 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <Button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-4text-zinc-400 hover:text-zinc-300 p-1"
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

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingText="กำลังอัปเดตรหัสผ่าน..."
          rightIcon={<ArrowRightIcon className="w-5 h-5" />}
          fullWidth
          size="lg"
        >
          อัปเดตรหัสผ่าน
        </Button>
      </form>

    </AuthLayout>
  );
}

/**
 * Update Password Page Component
 * Allows authenticated users to update their password
 * 
 * Features:
 * - Password strength indicator
 * - Password confirmation
 * - Form validation
 * - Error handling
 * - Success confirmation
 * - Auto-redirect after success
 * - Password visibility toggle
 * - Authentication check
 */
export default function UpdatePasswordPage() {
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
      <UpdatePasswordForm />
    </Suspense>
  );
}
