import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";

import "@heroui/theme";
import { Providers } from "./providers";

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

/**
 * Root Layout
 * This layout is required by Next.js and must include <html> and <body> tags.
 * With next-intl, the locale-specific content is handled in [locale]/layout.tsx
 * 
 * Note: next-intl middleware handles redirecting root path to /th automatically
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout with html/body - locale-specific attributes are handled via script
  return (
    <html lang="th" className={`${baiJamjuree.variable} antialiased`} suppressHydrationWarning>
      <body className="bg-white text-zinc-950" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
