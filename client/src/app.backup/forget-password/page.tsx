"use client";

import { useState, Suspense } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from '@shared/lib/database/supabase/client';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button } from "@/components/shared";
import { Loading } from "@/components/design-system/primitives/Loading";
import { logger } from '@shared/lib/utils/logger';

interface ForgetPasswordFormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

const INITIAL_FORM_DATA: ForgetPasswordFormData = { email: "" };

function ForgetPasswordPageContent() {
  const supabase = createClient();
  const locale = useLocale();
  const t = useTranslations("auth.forgotPassword");
  const tErrors = useTranslations("auth.forgotPassword.errors");

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const { email } = formData;
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = tErrors("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = tErrors("emailInvalid");
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
        const updatedErrors = { ...prev };
        delete updatedErrors[name as keyof FormErrors];
        return updatedErrors;
      });
    }
  };

  const handleRateLimitMessage = (rateLimitError: { message: string; retryAfter?: number }): string => {
    let message = rateLimitError.message;
    if (rateLimitError.retryAfter) {
      const minutes = Math.floor(rateLimitError.retryAfter / 60);
      const seconds = rateLimitError.retryAfter % 60;
      if (locale === "th") {
        message = `${rateLimitError.message} กรุณารอ ${minutes > 0 ? `${minutes} นาที` : ""}${seconds > 0 ? ` ${seconds} วินาที` : ""} แล้วลองใหม่อีกครั้ง`;
      } else if (locale === "jp") {
        message = `${rateLimitError.message} ${minutes > 0 ? `${minutes}分` : ""}${seconds > 0 ? ` ${seconds}秒` : ""}待ってからもう一度お試しください`;
      } else {
        message = `${rateLimitError.message} Please wait ${minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : ""}${seconds > 0 ? ` ${seconds} second${seconds > 1 ? "s" : ""}` : ""} and try again`;
      }
    }
    return message;
  };

  const trySmtpFallback = async (email: string) => {
    const smtpResponse = await fetch("/api/auth/smtp-reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (smtpResponse.status === 429) {
      const { checkRateLimitError } = await import(
        "@shared/lib/utils/rate-limit-error"
      );
      const rateLimitError = await checkRateLimitError(smtpResponse);
      if (rateLimitError) {
        setErrors({ general: handleRateLimitMessage(rateLimitError) });
        return false;
      }
    }
    if (smtpResponse.ok) {
      setIsSuccess(true);
      return true;
    } else {
      const smtpData = await smtpResponse.json();
      setErrors({
        general: smtpData.error || tErrors("sendEmailFailed"),
      });
      return false;
    }
  };

  const supabaseErrorToMessage = (message: string): string => {
    switch (true) {
      case /Invalid email/.test(message):
        return tErrors("emailInvalidFormat");
      case /User not found/.test(message):
        return tErrors("userNotFound");
      case /fetch|Failed to fetch/.test(message):
        return tErrors("connectionError");
      default:
        return `${tErrors("errorPrefix")}${message}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (!supabase) throw new Error("Supabase client is not initialized");

      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/api/auth/callback?type=recovery&next=/update-password`,
        }
      );

      if (error) {
        const message = error.message;

        // Fallback and rate-limit detection
        if (
          message.includes("rate limit") ||
          message.includes("confirmation email") ||
          message.includes("429")
        ) {
          logger.warn("Using SMTP fallback for password reset");
          await trySmtpFallback(formData.email);
          return;
        } else {
          setErrors({ general: supabaseErrorToMessage(message) });
          return;
        }
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrors({ general: tErrors("unknownError") });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Success Feedback ---
  if (isSuccess) {
    return (
      <AuthLayout title={t("success.title")} subtitle={t("success.subtitle")}>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500" />
          </div>
          <p className="mb-2 text-zinc-950 text-base">{t("success.message")}</p>
          <p className="mb-6 font-mono text-sm">{formData.email}</p>
          <div className="bg-blue-500/20 mb-6 p-4 border border-blue-500 ">
            <p className="text-blue-400 text-sm whitespace-pre-line">
              {t("success.tip")}
            </p>
          </div>
          <Button asChild variant="primary" size="lg">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // --- Render Main Form ---
  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-500/20 p-4 border border-red-500/70 shadow-red-500/20 ">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="shrink-0 w-6 h-6 text-red-400" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          </div>
        )}
        <div className="bg-white text-zinc-950 p-4 border border-gray-300 hover:border-gray-400 ">
          <p className="text-zinc-950 text-sm">{t("infoMessage")}</p>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block mb-2 font-medium text-zinc-950 text-sm"
          >
            {t("emailLabel")}
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full bg-white text-zinc-950 border ${
                errors.email
                  ? "border-red-500/70 shadow-red-500/20"
                  : "border-gray-300 hover:border-gray-400"
              }  px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm`}
              placeholder={t("emailPlaceholder")}
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
          loadingText={t("loadingText")}
          fullWidth
          size="lg"
        >
          {t("button")}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Button
          asChild
          variant="link"
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </div>
      <div className="text-center mt-4">
        <p className="text-gray-600 text-sm">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            {t("signupLink")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function LoadingFallback() {
  const t = useTranslations("common.messages");
  return (
    <div className="min-h-[calc(100vh-132px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-white text-zinc-950 shadow-2xl p-6  text-center space-y-4">
          <Loading centered size="lg" />
          <p className="text-zinc-950">{t("loading")}</p>
        </div>
      </div>
    </div>
  );
}

export default function ForgetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ForgetPasswordPageContent />
    </Suspense>
  );
}
