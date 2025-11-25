"use client";

import { Suspense } from "react";
import { AlertProvider, AuthProvider, ReferralProvider } from "@/contexts";
import { ReferralCodeTracker } from "@/components/shared/ReferralCodeTracker";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/design-system";
import { MSWInitializer } from "@/components/mocks/MSWInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthProvider>
          <ReferralProvider>
            <AlertProvider>
              <>
                <MSWInitializer />
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
  );
}