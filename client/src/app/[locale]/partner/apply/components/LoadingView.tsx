"use client";

import { PageLoadingFallback } from "@/components/shared";

/**
 * Loading screen component while checking authentication
 * 
 * Uses the standardized PageLoadingFallback component for consistency across the application
 */
export const LoadingView = () => {
  return <PageLoadingFallback variant="dark" message="กำลังโหลด..." />;
};

