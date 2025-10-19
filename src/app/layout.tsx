import type { Metadata } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";
import { LayoutWrapper, ErrorBoundary } from "@/components/shared";
import { Providers } from "./providers";

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "MUAYTHAI NEXT",
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
      <body className="bg-zinc-800 text-zinc-50">
        <Providers>
          <LayoutWrapper>
            <ErrorBoundary>{children}</ErrorBoundary>
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
