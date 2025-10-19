"use client";

import { AlertProvider, AuthProvider } from "@/contexts";
import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <AlertProvider>{children}</AlertProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}