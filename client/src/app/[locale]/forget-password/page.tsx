"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from '@shared/lib/database/supabase/client';
import {
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button, AuthLoadingFallback } from "@/components/shared";
import { AuthFormField, AuthFormError, AuthFormInfo } from "@/components/features/auth";
import { logger } from '@shared/lib/utils/logger';
import { VALIDATION_PATTERNS } from '@shared/lib/constants/validation';

interface ForgetPasswordFormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

interface RateLimitError {
  message: string;
  retryAfter?: number;
}

const INITIAL_FORM_DATA: ForgetPasswordFormData = { email: "" };
const INITIAL_ERRORS: FormErrors = {};

// Error message patterns for Supabase error mapping
const ERROR_PATTERNS = {
  INVALID_EMAIL: /Invalid email/i,
  USER_NOT_FOUND: /User not found/i,
  CONNECTION_ERROR: /fetch|Failed to fetch/i,
} as const;

function ForgetPasswordPageContent() {
  const supabase = createClient();
  const locale = useLocale();
  const t = useTranslations("auth.forgotPassword");
  const tErrors = useTranslations("auth.forgotPassword.errors");

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Memoized validation function
  const validateForm = useCallback((): boolean => {
    const { email } = formData;
    const trimmedEmail = email.trim();
    const newErrors: FormErrors = {};

    if (!trimmedEmail) {
      newErrors.email = tErrors("emailRequired");
    } else if (!VALIDATION_PATTERNS.EMAIL.test(trimmedEmail)) {
      newErrors.email = tErrors("emailInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.email, tErrors]);

  // Optimized input change handler with error clearing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field if it exists
    setErrors((prev) => {
      if (prev[name as keyof FormErrors]) {
        const updatedErrors = { ...prev };
        delete updatedErrors[name as keyof FormErrors];
        return updatedErrors;
      }
      return prev;
    });
  }, []);

  // Memoized rate limit message formatter
  const handleRateLimitMessage = useCallback((rateLimitError: RateLimitError): string => {
    if (!rateLimitError.retryAfter) {
      return rateLimitError.message;
    }

    const minutes = Math.floor(rateLimitError.retryAfter / 60);
    const seconds = rateLimitError.retryAfter % 60;

    const timeParts: string[] = [];
    if (minutes > 0) {
      timeParts.push(locale === "th" ? `${minutes} นาที` : locale === "jp" ? `${minutes}分` : `${minutes} minute${minutes > 1 ? "s" : ""}`);
    }
    if (seconds > 0) {
      timeParts.push(locale === "th" ? `${seconds} วินาที` : locale === "jp" ? `${seconds}秒` : `${seconds} second${seconds > 1 ? "s" : ""}`);
    }

    const timeString = timeParts.join(" ");

    if (locale === "th") {
      return `${rateLimitError.message} กรุณารอ ${timeString} แล้วลองใหม่อีกครั้ง`;
    } else if (locale === "jp") {
      return `${rateLimitError.message} ${timeString}待ってからもう一度お試しください`;
    } else {
      return `${rateLimitError.message} Please wait ${timeString} and try again`;
    }
  }, [locale]);

  // Memoized SMTP fallback function
  const trySmtpFallback = useCallback(async (email: string): Promise<boolean> => {
    try {
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
      }

      const smtpData = await smtpResponse.json().catch(() => ({}));
      setErrors({
        general: smtpData.error || tErrors("sendEmailFailed"),
      });
      return false;
    } catch (error) {
      logger.error("SMTP fallback error:", { error });
      setErrors({ general: tErrors("sendEmailFailed") });
      return false;
    }
  }, [handleRateLimitMessage, tErrors]);

  // Memoized error message mapper
  const supabaseErrorToMessage = useCallback((message: string): string => {
    if (ERROR_PATTERNS.INVALID_EMAIL.test(message)) {
      return tErrors("emailInvalidFormat");
    }
    if (ERROR_PATTERNS.USER_NOT_FOUND.test(message)) {
      return tErrors("userNotFound");
    }
    if (ERROR_PATTERNS.CONNECTION_ERROR.test(message)) {
      return tErrors("connectionError");
    }
    return `${tErrors("errorPrefix")}${message}`;
  }, [tErrors]);

  // Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors(INITIAL_ERRORS);

    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized");
      }

      // Get base URL for password reset redirect
      // Priority: NEXT_PUBLIC_APP_URL > window.location.origin
      const baseUrl = 
        (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

      const redirectUrl = `${baseUrl}/api/auth/callback?type=recovery&next=/update-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email.trim(),
        { redirectTo: redirectUrl }
      );

      if (error) {
        const message = error.message.toLowerCase();
        const shouldUseFallback = 
          message.includes("rate limit") ||
          message.includes("confirmation email") ||
          message.includes("429");

        if (shouldUseFallback) {
          logger.warn("Using SMTP fallback for password reset");
          await trySmtpFallback(formData.email.trim());
          return;
        }

        setErrors({ general: supabaseErrorToMessage(error.message) });
        return;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error("Password reset error:", { error: err  });
      setErrors({ general: tErrors("unknownError") });
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, validateForm, supabase, trySmtpFallback, supabaseErrorToMessage, tErrors]);

  // Memoized translations to prevent unnecessary re-renders
  const translations = useMemo(() => ({
    title: t("title"),
    subtitle: t("subtitle"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    infoMessage: t("infoMessage"),
    button: t("button"),
    loadingText: t("loadingText"),
    backToLogin: t("backToLogin"),
    noAccount: t("noAccount"),
    signupLink: t("signupLink"),
    successTitle: t("success.title"),
    successSubtitle: t("success.subtitle"),
    successMessage: t("success.message"),
    successTip: t("success.tip"),
  }), [t]);

  // Memoized error message
  const generalError = useMemo(() => errors.general || "", [errors.general]);

  // --- Render Success Feedback ---
  if (isSuccess) {
    return (
      <AuthLayout title={translations.successTitle} subtitle={translations.successSubtitle}>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500" aria-hidden="true" />
          </div>
          <p className="mb-2 text-zinc-950 text-base">{translations.successMessage}</p>
          <p className="mb-6 font-mono text-sm" aria-label="Email address">{formData.email}</p>
          <div className="bg-blue-500/20 mb-6 p-4 border border-blue-500 ">
            <p className="text-blue-400 text-sm whitespace-pre-line">
              {translations.successTip}
            </p>
          </div>
          <Button asChild variant="primary" size="lg">
            <Link href="/login">{translations.backToLogin}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // --- Render Main Form ---
  return (
    <AuthLayout title={translations.title} subtitle={translations.subtitle}>
      <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
        <AuthFormError message={generalError} />
        <AuthFormInfo message={translations.infoMessage} />
        <AuthFormField
          label={translations.emailLabel}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder={translations.emailPlaceholder}
          autoComplete="email"
          required
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingText={translations.loadingText}
          fullWidth
          size="lg"
        >
          {translations.button}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Button
          asChild
          variant="link"
          leftIcon={<ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />}
        >
          <Link href="/login">{translations.backToLogin}</Link>
        </Button>
      </div>
      <div className="text-center mt-4">
        <p className="text-gray-600 text-sm">
          {translations.noAccount}{" "}
          <Link
            href="/signup"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            {translations.signupLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function ForgetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <ForgetPasswordPageContent />
    </Suspense>
  );
}
