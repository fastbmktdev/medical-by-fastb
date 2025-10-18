"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Avatar, Chip } from '@heroui/react';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
      // Silently handle logout errors
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-zinc-950 to-zinc-900 min-h-screen">
      {/* Sidebar - Desktop */}
      {!hideSidebar && (
        <aside className="hidden top-0 lg:sticky lg:flex flex-col bg-zinc-900/50 backdrop-blur-xl border-white/5 border-r w-64 h-screen max-h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 p-6 border-white/5 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-red-600 rounded w-10 h-10 font-bold text-white">
                MT
              </div>
              <span className="font-semibold text-white text-lg">
                MUAYTHAI
              </span>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-6 border-white/5 border-b">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                size="md"
                classNames={{
                  base: `bg-gradient-to-br ${
                    roleColor === 'danger' ? 'from-red-600 to-red-700' :
                    roleColor === 'secondary' ? 'from-purple-600 to-purple-700' :
                    'from-blue-600 to-blue-700'
                  }`,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {userEmail?.split('@')[0] || 'ผู้ใช้'}
                </p>
                <p className="text-default-400 text-xs truncate">{userEmail}</p>
              </div>
            </div>
            <Chip color={roleColor} variant="flat" size="sm" className="justify-center w-full">
              {roleLabel}
            </Chip>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-danger text-white font-semibold'
                      : 'text-default-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Partner Button */}
          {showPartnerButton && (
            <div className="px-4 pb-4">
              <Button
                as={Link}
                href="/partner/apply"
                variant="flat"
                color="secondary"
                startContent={<BriefcaseIcon className="w-5 h-5" />}
                className="w-full font-semibold"
              >
                สมัครพาร์ทเนอร์
              </Button>
            </div>
          )}

          {/* Logout Button */}
          <div className="p-4 border-white/5 border-t">
            <Button
              onPress={handleLogout}
              variant="flat"
              color="danger"
              startContent={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
              className="w-full font-semibold"
            >
              ออกจากระบบ
            </Button>
          </div>
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
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-6 border-white/5 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-red-600 rounded w-10 h-10 font-bold text-white">
                MT
              </div>
              <span className="font-semibold text-white text-lg">
                MUAYTHAI
              </span>
            </Link>
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsSidebarOpen(false)}
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6 border-white/5 border-b">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                size="md"
                classNames={{
                  base: `bg-gradient-to-br ${
                    roleColor === 'danger' ? 'from-red-600 to-red-700' :
                    roleColor === 'secondary' ? 'from-purple-600 to-purple-700' :
                    'from-blue-600 to-blue-700'
                  }`,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {userEmail?.split('@')[0] || 'ผู้ใช้'}
                </p>
                <p className="text-default-400 text-xs truncate">{userEmail}</p>
              </div>
            </div>
            <Chip color={roleColor} variant="flat" size="sm" className="justify-center w-full">
              {roleLabel}
            </Chip>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-danger text-white font-semibold'
                      : 'text-default-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Partner Button */}
          {showPartnerButton && (
            <div className="px-4 pb-4">
              <Button
                as={Link}
                href="/partner/apply"
                variant="flat"
                color="secondary"
                startContent={<BriefcaseIcon className="w-5 h-5" />}
                className="w-full font-semibold"
                onPress={() => setIsSidebarOpen(false)}
              >
                สมัครพาร์ทเนอร์
              </Button>
            </div>
          )}

          {/* Logout Button */}
          <div className="p-4 border-white/5 border-t">
            <Button
              onPress={handleLogout}
              variant="flat"
              color="danger"
              startContent={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
              className="w-full font-semibold"
            >
              ออกจากระบบ
            </Button>
          </div>
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
        <main className="flex-1 mt-16 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

