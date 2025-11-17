"use client";

import { usePathname } from "next/navigation";
import { usePageView } from "@/lib/hooks/usePageView";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [firstSegment, secondSegment, thirdSegment] = segments;

  const matchSegment = (value: string) =>
    firstSegment === value || secondSegment === value;

  const isAdminPage = matchSegment("admin");
  const isDashboardPage = matchSegment("dashboard");
  const isPartnerDashboard =
    (firstSegment === "partner" && secondSegment === "dashboard") ||
    (secondSegment === "partner" && thirdSegment === "dashboard");

  // ไม่แสดง header และ footer ในหน้า authentication
  const authPages = new Set([
    "login",
    "signup",
    "forget-password",
    "reset-password",
    "update-password",
    "verification-pending",
  ]);
  const lastSegment = segments[segments.length - 1];
  const isAuthPage = !!lastSegment && authPages.has(lastSegment);

  const isComingSoonPage =
    lastSegment === "coming-soon" || pathname === "/coming-soon";

  const hideHeaderFooter =
    isAdminPage || isDashboardPage || isPartnerDashboard || isAuthPage || isComingSoonPage;

  // Track page views automatically
  usePageView();

  return (
    <div className="min-h-[calc(100vh-1px)] flex flex-col">
      {!hideHeaderFooter && <Header />}
      <main className="flex-1">{children}</main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}