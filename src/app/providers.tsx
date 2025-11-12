"use client";

import { Suspense, useEffect, useMemo } from "react";
import { AlertProvider, AuthProvider, ReferralProvider } from "@/contexts";
import { ReferralCodeTracker } from "@/components/shared/ReferralCodeTracker";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/design-system";
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import {
  DEFAULT_GROWTHBOOK_ATTRIBUTES,
  GROWTHBOOK_API_HOST,
  GROWTHBOOK_CLIENT_KEY,
} from "@/lib/flags/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const growthbook = useMemo(
    () =>
      new GrowthBook({
        apiHost: GROWTHBOOK_API_HOST,
        clientKey: GROWTHBOOK_CLIENT_KEY,
        attributes: DEFAULT_GROWTHBOOK_ATTRIBUTES,
      }),
    []
  );

  useEffect(() => {
    if (!GROWTHBOOK_CLIENT_KEY) {
      console.warn(
        "[growthbook] Missing NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY – experiments will use fallback values."
      );
      return;
    }

    growthbook.loadFeatures({ autoRefresh: true }).catch((error) => {
      console.error("[growthbook] Failed to load features", error);
    });

    if (typeof window !== "undefined") {
      growthbook.setURL(window.location.href);
    }
  }, [growthbook]);

  return (
    <GrowthBookProvider growthbook={growthbook}>
      <ThemeProvider>
        <HeroUIProvider>
          <AuthProvider>
            <ReferralProvider>
              <AlertProvider>
                <>
                  <Suspense fallback={null}>
                    <ReferralCodeTracker />
                  </Suspense>
                  {children}
                </>
              </AlertProvider>
            </ReferralProvider>
          </AuthProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </GrowthBookProvider>
  );
}