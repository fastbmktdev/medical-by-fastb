"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react';
import {
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts';
import { useRouter } from 'next/navigation';
import SidebarContent from '@/components/shared/layout/SidebarContent';

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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      alert("เกิดข้อผิดพลาดในการออกจากระบบ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const sidebarProps = {
    menuItems,
    pathname,
    roleLabel,
    roleColor,
    userEmail,
    showPartnerButton,
    handleLogout,
  };

  return (
    <div className="flex bg-gradient-to-br from-zinc-950 to-zinc-900 min-h-screen">
      {/* Sidebar - Desktop */}
      {!hideSidebar && (
        <aside className="hidden top-0 lg:sticky lg:flex flex-col bg-zinc-900/50 backdrop-blur-xl border-white/5 border-r w-64 h-screen max-h-screen">
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
          className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-zinc-900 border-r border-white/5 w-64 transform transition-transform duration-300 ${
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
          <header className="lg:hidden flex justify-between items-center bg-zinc-900/50 backdrop-blur-xl px-4 py-4 border-white/5 border-b">
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6 text-white" />
            </Button>
            <h1 className="font-bold text-white text-lg">{headerTitle}</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>
        )}

        {/* Page Header */}
        <div className="bg-gradient-to-r from-red-950/20 to-transparent px-4 sm:px-6 lg:px-8 py-8 border-white/5 border-b">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-2 font-bold text-white text-3xl md:text-4xl">
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
