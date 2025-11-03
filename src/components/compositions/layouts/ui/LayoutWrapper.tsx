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
  
  // ไม่แสดง header และ footer ในหน้า authentication
  const authPages = ['/login', '/signup', '/forget-password', '/reset-password', '/update-password'];
  const isAuthPage = authPages.includes(pathname);

  const hideHeaderFooter = isAdminPage || isDashboardPage || isPartnerDashboard || isAuthPage;

  return (
    <div className="min-h-[calc(100vh_-_1px)] flex flex-col">
      {!hideHeaderFooter && <Header />}
      <main className="flex-1">{children}</main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}