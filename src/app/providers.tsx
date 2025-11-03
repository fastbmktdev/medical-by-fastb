"use client";

import { AlertProvider, AuthProvider } from "@/contexts";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/design-system";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthProvider>
          <AlertProvider>{children}</AlertProvider>
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}