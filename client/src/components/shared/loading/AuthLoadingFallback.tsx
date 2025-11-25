"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/design-system/primitives/Loading";

export interface AuthLoadingFallbackProps {
  /**
   * Custom loading message
   */
  message?: string;
  
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Auth Loading Fallback Component
 * 
 * Standardized loading fallback for authentication pages.
 * Uses the standard Loading component for consistency.
 * 
 * @example
 * ```tsx
 * <Suspense fallback={<AuthLoadingFallback />}>
 *   <AuthPageContent />
 * </Suspense>
 * ```
 */
const AuthLoadingFallbackComponent = ({ 
  message,
  className 
}: AuthLoadingFallbackProps) => {
  const t = useTranslations("common.messages");
  const loadingMessage = message || t("loading");

  return (
    <div className={`min-h-[calc(100vh-132px)] flex items-center justify-center py-8 ${className || ''}`}>
      <div className="w-full max-w-md">
        <div className="bg-white text-zinc-950 shadow-2xl p-6  text-center space-y-4">
          <Loading centered size="lg" />
          <p className="text-zinc-950">{loadingMessage}</p>
        </div>
      </div>
    </div>
  );
};

export const AuthLoadingFallback = memo(AuthLoadingFallbackComponent);
AuthLoadingFallback.displayName = "AuthLoadingFallback";

