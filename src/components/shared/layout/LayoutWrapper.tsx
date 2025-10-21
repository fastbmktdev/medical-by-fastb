"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isPartnerDashboard = pathname.startsWith("/partner/dashboard");

  const hideHeaderFooter = isAdminPage || isDashboardPage || isPartnerDashboard;

  return (
    <div className="min-h-(calc(100vh_-_124px)) flex flex-col">
      {!hideHeaderFooter && <Header />}
      <main className="flex-1">{children}</main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}
