'use client';

import { usePathname } from 'next/navigation';
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard');

  return (
    <div className="min-h-(calc(100vh_-_128px)) flex flex-col">
      {!isAdminPage && !isDashboardPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isAdminPage && !isDashboardPage && <Footer />}
    </div>
  );
}
