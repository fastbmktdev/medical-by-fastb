"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/shared";
import * as Sentry from "@sentry/nextjs";

export default function ServerErrorPage() {
  const t = useTranslations("error.server");
  const router = useRouter();
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    // Get error ID from URL or generate one
    const params = new URLSearchParams(window.location.search);
    const id = params.get("errorId");
    setErrorId(id);

    // Log to Sentry
    if (id) {
      Sentry.captureMessage("500 Error Page Accessed", {
        level: "error",
        tags: { errorId: id },
      });
    }
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleContactSupport = () => {
    router.push("/contact");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800  shadow-xl p-8 md:p-12">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl " />
            <div className="relative bg-red-100 dark:bg-red-900/30 p-4 ">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white text-center mb-4">
          {t("title")}
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-2 text-lg">
          {t("description")}
        </p>

        {/* Error ID */}
        {errorId && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 font-mono">
            {t("errorId")}: {errorId}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={handleRetry}
            variant="primary"
            size="lg"
            leftIcon={<ArrowPathIcon className="w-5 h-5" />}
            fullWidth
          >
            {t("tryAgain")}
          </Button>
          <Button
            onClick={handleGoHome}
            variant="secondary"
            size="lg"
            leftIcon={<HomeIcon className="w-5 h-5" />}
            fullWidth
          >
            {t("goHome")}
          </Button>
        </div>

        {/* Contact Support */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            {t("needHelp")}
          </p>
          <Button
            onClick={handleContactSupport}
            variant="outline"
            size="md"
            leftIcon={<EnvelopeIcon className="w-4 h-4" />}
            fullWidth
          >
            {t("contactSupport")}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("timestamp")}: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

