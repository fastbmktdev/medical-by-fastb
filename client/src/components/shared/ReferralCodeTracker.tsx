"use client";

import { useEffect, memo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReferralCode } from "@/contexts";
import { isValidReferralCodeFormat } from '@shared/lib/utils/affiliate';

/**
 * ReferralCodeTracker
 * Watches for `ref` query parameters and persists them in sessionStorage
 * via the ReferralProvider. Lives near the top of the app tree.
 */
function ReferralCodeTrackerComponent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { referralCode, setReferralCode } = useReferralCode();

  useEffect(() => {
    if (!searchParams) return;

    const refParam = searchParams.get("ref");
    if (!refParam) {
      return;
    }

    const normalizedCode = refParam.trim().toUpperCase();
    if (!isValidReferralCodeFormat(normalizedCode)) {
      return;
    }

    if (referralCode !== normalizedCode) {
      setReferralCode(normalizedCode);
    }
  }, [referralCode, searchParams, setReferralCode, pathname]);

  return null;
}

export const ReferralCodeTracker = memo(ReferralCodeTrackerComponent);

