import type { Metadata } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";
import { LayoutWrapper, ErrorBoundary } from "@/components/shared";
import { Providers } from "./providers";
import { FixedBackground } from "@/components/shared/ui";
import AssetLoader from "@/components/shared/ui/AssetLoader";
import GamificationNotification from "@/components/features/gamification/GamificationNotification";

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "THAIKICK",
  description:
    "แพลตฟอร์มสำหรับค้นหาและจองค่ายมวยชั้นนำ และซื้อตั๋วเวทีมวยทั่วประเทศไทย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${baiJamjuree.variable} antialiased`}>
      <body className="bg-zinc-950 text-white">
        <AssetLoader>
          <FixedBackground />
          <Providers>
            <LayoutWrapper>
              <ErrorBoundary>{children}</ErrorBoundary>
              <GamificationNotification />
            </LayoutWrapper>
          </Providers>
        </AssetLoader>
      </body>
    </html>
  );
}
