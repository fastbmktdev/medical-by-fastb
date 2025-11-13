"use client";

import { useState, Suspense } from "react";
import { Link } from '@/navigation';
import { useLocale } from 'next-intl';
import { createClient } from "@/lib/database/supabase/client";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button } from "@/components/shared";
import { Loading } from "@/components/design-system/primitives/Loading";

interface ForgetPasswordFormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

function ForgetPasswordPageContent() {
  const supabase = createClient();
  const locale = useLocale();
  const [formData, setFormData] = useState<ForgetPasswordFormData>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/api/auth/callback?type=recovery&next=/update-password`,
        }
      );

      if (error) {
        // Check for rate limit or email sending issues
        if (error.message.includes("rate limit") || error.message.includes("confirmation email") || error.message.includes("429")) {
          console.log("⚠️ Using SMTP fallback for password reset");
          
          // Use SMTP fallback via API
          const smtpResponse = await fetch("/api/auth/smtp-reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
            }),
          });

          // Check for rate limit error (HTTP 429)
          if (smtpResponse.status === 429) {
            const { checkRateLimitError, formatRateLimitMessageThai } = await import('@/lib/utils/rate-limit-error');
            const rateLimitError = await checkRateLimitError(smtpResponse);
            
            if (rateLimitError) {
              setErrors({
                general: formatRateLimitMessageThai(rateLimitError),
              });
              return;
            }
          }

          if (smtpResponse.ok) {
            setIsSuccess(true);
            return;
          } else {
            const smtpData = await smtpResponse.json();
            setErrors({
              general: smtpData.error || "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
            });
            return;
          }
        } else if (error.message.includes("Invalid email")) {
          setErrors({
            general: "อีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
          });
        } else if (error.message.includes("User not found")) {
          setErrors({
            general: "ไม่พบผู้ใช้ที่ใช้อีเมลนี้ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่",
          });
        } else if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
          setErrors({
            general: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
          });
        } else {
          setErrors({
            general: `เกิดข้อผิดพลาด: ${error.message}`,
          });
        }
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setErrors({
            general: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
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

  if (isSuccess) {
    return (
      <AuthLayout
        title="ส่งอีเมลสำเร็จ!"
        subtitle="เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500" />
          </div>
          <p className="mb-2 text-zinc-300 text-base">
            เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง
          </p>
          <p className="mb-6 font-mono text-sm">{formData.email}</p>
          <div className="bg-blue-500/20 mb-6 p-4 border border-blue-500 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 กรุณาตรวจสอบอีเมลและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
              <br />
              (ตรวจสอบในโฟลเดอร์ Spam หากไม่พบ)
            </p>
          </div>
          <Button
            asChild
            variant="primary"
            size="lg"
          >
            <Link href="/login">
              กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
      <AuthLayout
        title="ลืมรหัสผ่าน"
        subtitle="ไม่ต้องกังวล เราจะช่วยคุณรีเซ็ตรหัสผ่าน"
      >
      <form onSubmit={handleSubmit} className="space-y-6 pr-6">
        {errors.general && (
          <div className="bg-red-500/20 p-4 border border-red-500/70 shadow-red-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="shrink-0 w-6 h-6 text-red-400" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          </div>
        )}

        <div className="bg-zinc-700 p-4 border border-zinc-600/50 hover:border-zinc-500/70 rounded-lg">
          <p className="text-zinc-300 text-sm">
            📧 กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้
          </p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            อีเมล
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
                  className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                    errors.email ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
                  } rounded-xl px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
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

        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingText="กำลังส่งอีเมล..."
          fullWidth
          size="lg"
        >
          ส่งลิงก์รีเซ็ตรหัสผ่าน
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Button
          asChild
          variant="link"
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          <Link href="/login">
            กลับไปยังหน้าเข้าสู่ระบบ
          </Link>
        </Button>
      </div>

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
    </AuthLayout>
  );
}

export default function ForgetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh_-_132px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl text-center space-y-4">
            <Loading centered size="lg" />
            <p className="text-zinc-300">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    }>
      <ForgetPasswordPageContent />
    </Suspense>
  );
}
