"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react';
import {
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import SidebarContent from './ui/SidebarContent';
import dynamic from 'next/dynamic';

// Dynamically import ImpersonationBanner to avoid SSR issues
const ImpersonationBanner = dynamic(
  () => import('@/components/features/admin/ImpersonationBanner').then(mod => ({ default: mod.ImpersonationBanner })),
  { ssr: false }
);

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  headerTitle: string;
  headerSubtitle: string;
  roleLabel: string;
  roleColor: "primary" | "secondary" | "success" | "warning" | "danger";
  userEmail?: string;
  showPartnerButton?: boolean;
  hideSidebar?: boolean;
}

/**
 * Dashboard Layout Component with Sidebar
 * 
 * Provides a consistent layout for all dashboard pages
 * with sidebar navigation on the left
 */
export default function DashboardLayout({
  children,
  menuItems,
  headerTitle,
  headerSubtitle,
  roleLabel,
  roleColor,
  userEmail,
  showPartnerButton = false,
  hideSidebar = false,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const handleLogout = async () => {
    await signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  const localePrefix = `/${locale}`;
  const trimmedPathname = pathname.startsWith(localePrefix)
    ? pathname.slice(localePrefix.length)
    : pathname;
  const normalizedPathname =
    trimmedPathname === ""
      ? "/"
      : trimmedPathname.startsWith("/")
        ? trimmedPathname
        : `/${trimmedPathname}`;

  const sidebarProps = {
    menuItems,
    pathname: normalizedPathname,
    roleLabel,
    roleColor,
    userEmail,
    showPartnerButton,
    handleLogout,
  };

  return (
    <div className="flex bg-white min-h-screen">
      {/* Sidebar - Desktop */}
      {!hideSidebar && (
        <aside className="hidden top-0 lg:sticky lg:flex flex-col bg-white backdrop-blur-xl border-gray-200 border-r w-64 h-screen max-h-screen">
          <SidebarContent {...sidebarProps} />
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {!hideSidebar && isSidebarOpen && (
        <div
          className="lg:hidden z-50 fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {!hideSidebar && (
        <aside
          className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 w-64 transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent
            {...sidebarProps}
            onLinkClick={() => setIsSidebarOpen(false)}
            onClose={() => setIsSidebarOpen(false)}
          />
        </aside>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top Bar - Mobile */}
        {!hideSidebar && (
          <header className="lg:hidden flex justify-between items-center bg-white backdrop-blur-xl px-4 py-4 border-gray-200 border-b">
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Bars3Icon className="w-6 h-6 text-zinc-950" />
            </Button>
            <h1 className="font-bold text-lg text-zinc-950">{headerTitle}</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>
        )}

        {/* Page Header - Hospital Theme */}
        <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-8 border-gray-200 border-b">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-2 font-bold text-3xl md:text-4xl">
              {headerTitle}
            </h1>
            <p className="text-default-400 text-lg">
              {headerSubtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            {/* Impersonation Banner - Only show for admin pages */}
            {roleLabel === 'ผู้ดูแลระบบ' && (
              <div className="mb-6">
                {typeof window !== 'undefined' && (
                  <ImpersonationBanner />
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
