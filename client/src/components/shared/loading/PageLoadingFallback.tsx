"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/design-system/primitives/Loading";

export interface PageLoadingFallbackProps {
  /**
   * Custom loading message
   */
  message?: string;
  
  /**
   * Background color variant
   */
  variant?: "light" | "dark";
  
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Page Loading Fallback Component
 * 
 * Standardized full-page loading fallback.
 * Uses the standard Loading component for consistency.
 * 
 * @example
 * ```tsx
 * <Suspense fallback={<PageLoadingFallback />}>
 *   <PageContent />
 * </Suspense>
 * ```
 */
const PageLoadingFallbackComponent = ({ 
  message,
  variant = "light",
  className 
}: PageLoadingFallbackProps) => {
  const t = useTranslations("common.messages");
  const loadingMessage = message || t("loading");

  const bgClass = variant === "dark" 
    ? "bg-zinc-100 text-zinc-300" 
    : "bg-white text-zinc-950";

  return (
    <div className={`flex justify-center items-center min-h-screen ${bgClass} ${className || ''}`}>
      <div className="text-center space-y-4">
        <Loading centered size="xl" color={variant === "dark" ? "primary" : "primary"} />
        <p className={variant === "dark" ? "text-zinc-300 text-lg" : "text-zinc-950 text-lg"}>
          {loadingMessage}
        </p>
      </div>
    </div>
  );
};

export const PageLoadingFallback = memo(PageLoadingFallbackComponent);
PageLoadingFallback.displayName = "PageLoadingFallback";

