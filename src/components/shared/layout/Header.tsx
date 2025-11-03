"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts";
import {
  getUserRole,
  UserRole,
  getDashboardPath,
  ROLE_NAMES,
} from "@/lib/auth/client";

type NavLink =
  | {
      text: string;
      href: string;
      dropdown?: never;
    }
  | {
      text: string;
      dropdown: { href: string; text: string }[];
      href?: never;
    };

export default function Header() {
  // Router for navigation
  const router = useRouter();

  // Authentication context
  const { user, signOut } = useAuth();

  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("TH");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null
  );

  /**
   * Fetch user role and application status when user changes
   */
  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);

        // Check if user has a gym application and its status
        const supabase = (
          await import("@/lib/database/supabase/client")
        ).createClient();
        const { data: gymData } = await supabase
          .from("gyms")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        setApplicationStatus(gymData?.status || null);
      } else {
        setUserRole(null);
        setApplicationStatus(null);
      }
    }
    fetchUserData();
  }, [user]);

  /**
   * Close user menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const userMenu = target.closest("[data-user-menu]");
      if (isUserMenuOpen && !userMenu) {
        setUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  /**
   * Handle user logout
   * Signs out user and redirects to home page
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsLoggingOut(false);
    router.push("/");
    router.refresh();
  };

  const navLinks: NavLink[] = [
    { text: "ค่ายมวย", href: "/gyms" },
    { text: "อีเวนต์", href: "/events" },
    { text: "โปรแกรม", href: "/fighter-program" },
    { text: "ร้านค้า", href: "/shop" },
    { text: "บทความ", href: "/articles" },
    {
      text: "ข้อมูล",
      dropdown: [
        { href: "/about", text: "เกี่ยวกับเรา" },
        { href: "/faq", text: "คำถามที่พบบ่อย" },
        { href: "/contact", text: "ติดต่อเรา" },
      ],
    },
  ];

  return (
    <header className="top-0 z-[5000] fixed bg-zinc-950/40 supports-[backdrop-filter]:bg-zinc-950/60 backdrop-blur border-white/10 border-b w-screen h-16 text-zinc-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex justify-center items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex justify-center items-center bg-brand-primary rounded w-8 h-8 font-bold text-white">
                TM
              </span>
              <span className="font-semibold text-base sm:text-lg">
                THAIKICK MUAYTHAI
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm">
              {navLinks.map((link) =>
                link.dropdown ? (
                  <div key={link.text} className="relative group">
                    <div className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer">
                      {link.text}
                      <ChevronDownIcon className="w-4 h-4" />
                    </div>
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-0 bg-zinc-950 shadow-lg border border-white/10 rounded-md w-48 z-50">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block hover:bg-white/5 px-4 py-2 text-white/80 text-sm"
                        >
                          {item.text}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-red-500 transition-colors"
                  >
                    {link.text}
                  </Link>
                )
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* User Menu (Desktop) */}
            {user ? (
              <div className="hidden md:block relative" data-user-menu>
                <button
                  onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 hover:bg-white/10 px-3 border border-white/20 rounded-lg h-10 transition-all duration-200 cursor-pointer group w-full"
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <UserCircleIcon className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                  <span className="max-w-[100px] text-sm truncate group-hover:text-white transition-colors">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div
                    className="right-0 absolute bg-zinc-950/95 backdrop-blur-md shadow-2xl top-full mt-2 border border-white/20 rounded-xl w-64 z-50 overflow-hidden"
                    data-user-menu
                  >
                    <div className="py-2">
                      {/* User Info */}
                      <div className="px-4 py-3 border-white/10 border-b bg-gradient-to-r from-zinc-800/30 to-zinc-700/30">
                        <p className="font-semibold text-sm truncate">
                          {user.user_metadata?.full_name || "ผู้ใช้งาน"}
                        </p>
                        <p className="text-zinc-400 text-xs truncate mt-1">
                          {user.email}
                        </p>
                        {userRole && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="inline-block bg-gradient-to-r from-red-500/20 to-red-600/20 px-3 py-1 rounded-full text-red-400 text-xs font-medium border border-red-500/30">
                              {ROLE_NAMES[userRole]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Dashboard Link - Role-based, but check application status */}
                      {userRole && (
                        <Link
                          href={getDashboardPath(userRole)}
                          onClick={() => setUserMenuOpen(false)}
                          className="group flex items-center gap-3 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 px-4 py-3 text-zinc-300 hover:text-white text-sm transition-all duration-200"
                        >
                          {userRole === "admin" && (
                            <ShieldCheckIcon className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                          )}
                          {userRole === "partner" && (
                            <BuildingStorefrontIcon className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                          )}
                          {userRole === "authenticated" && (
                            <HomeIcon className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                          )}
                          <span className="font-medium">แดชบอร์ด</span>
                        </Link>
                      )}

                      {/* Apply for Partner - Show only for authenticated users without pending/approved application */}
                      {userRole === "authenticated" && !applicationStatus && (
                        <Link
                          href="/partner/apply"
                          onClick={() => setUserMenuOpen(false)}
                          className="group flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-600/10 px-4 py-3 text-zinc-300 hover:text-white text-sm transition-all duration-200"
                        >
                          <BuildingStorefrontIcon className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                          <span className="font-medium">สมัคร Partner</span>
                        </Link>
                      )}

                      {/* Show Application Status if pending */}
                      {userRole === "authenticated" &&
                        applicationStatus === "pending" && (
                          <div className="px-4 py-3 border-white/10 border-t bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                              <p className="text-yellow-400 text-xs font-medium">
                                📋 รอการอนุมัติ Partner
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="group flex items-center gap-3 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 disabled:opacity-50 px-4 py-3 w-full text-zinc-300 hover:text-white text-sm text-left transition-all duration-200"
                        aria-label="Button"
                      >
                        <ArrowRightStartOnRectangleIcon className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                        <span className="font-medium">
                          {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 px-4 rounded h-10 font-medium text-sm transition-colors"
              >
                <UserCircleIcon className="w-5 h-5" />
                เข้าสู่ระบบ
              </Link>
            )}

            {/* Language Switcher */}
            <div
              className="relative"
              onMouseEnter={() => setLangDropdownOpen(true)}
              onMouseLeave={() => setLangDropdownOpen(false)}
            >
              <div className="hidden md:inline-flex justify-center items-center hover:bg-white/5 border border-white/20 rounded w-12 h-10 font-semibold text-sm cursor-pointer">
                {currentLang}
              </div>
              {isLangDropdownOpen && (
                <div className="right-0 absolute bg-zinc-950 shadow-lg mt-2 border border-white/10 rounded-md w-32 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => setCurrentLang("TH")}
                      className="block hover:bg-white/5 px-4 py-2 w-full text-white/80 text-sm text-left"
                    >
                      ไทย (TH)
                    </button>
                    <button
                      onClick={() => setCurrentLang("EN")}
                      className="block hover:bg-white/5 px-4 py-2 w-full text-white/80 text-sm text-left"
                    >
                      English (EN)
                    </button>
                    <button
                      onClick={() => setCurrentLang("JP")}
                      className="block hover:bg-white/5 px-4 py-2 w-full text-white/80 text-sm text-left"
                    >
                      日本語 (JP)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              aria-label="Toggle menu"
              className="md:hidden inline-flex justify-center items-center hover:bg-white/5 border border-white/20 rounded w-10 h-10"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                {isMobileMenuOpen ? (
                  <path
                    fillRule="evenodd"
                    d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 111.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm.75 4.5a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/80 border-white/10 border-t">
          <div className="gap-4 grid mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl text-sm">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.text}>
                  <p className="px-4 font-semibold text-white/60">
                    {link.text}
                  </p>
                  <div className="grid mt-1">
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hover:bg-white/5 px-4 py-2 rounded-md text-white/80"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.text}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:bg-white/5 -mx-4 px-4 py-2 rounded-md hover:text-red-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.text}
                </Link>
              )
            )}

            {/* User Menu (Mobile) */}
            <div className="pt-4 border-white/10 border-t">
              {user ? (
                <div className="space-y-2">
                  {/* User Info */}
                  <div className="bg-zinc-950 px-4 py-3 rounded">
                    <p className="font-medium text-sm truncate">
                      {user.user_metadata?.full_name || "ผู้ใช้งาน"}
                    </p>
                    <p className="text-white/60 text-xs truncate">
                      {user.email}
                    </p>
                    {userRole && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="inline-block bg-red-500/20 px-2 py-0.5 rounded text-red-400 text-xs">
                          {ROLE_NAMES[userRole]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dashboard Link - Role-based */}
                  {userRole && (
                    <Link
                      href={getDashboardPath(userRole)}
                      className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-700 px-4 py-2 rounded font-medium text-sm transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {userRole === "admin" && (
                        <ShieldCheckIcon className="w-5 h-5" />
                      )}
                      {userRole === "partner" && (
                        <BuildingStorefrontIcon className="w-5 h-5" />
                      )}
                      {userRole === "authenticated" && (
                        <HomeIcon className="w-5 h-5" />
                      )}
                      <span>แดชบอร์ด</span>
                    </Link>
                  )}

                  {/* Apply for Partner - Show only for authenticated users without pending/approved application */}
                  {userRole === "authenticated" && !applicationStatus && (
                    <Link
                      href="/partner/apply"
                      className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-700 px-4 py-2 rounded font-medium text-sm transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BuildingStorefrontIcon className="w-5 h-5" />
                      <span>สมัคร Partner</span>
                    </Link>
                  )}

                  {/* Show Application Status if pending */}
                  {userRole === "authenticated" &&
                    applicationStatus === "pending" && (
                      <div className="bg-yellow-500/20 px-4 py-3 border border-yellow-500/30 rounded">
                        <p className="font-medium text-sm">
                          📋 รอการอนุมัติ Partner
                        </p>
                        <p className="mt-1 text-yellow-400 text-xs">
                          ทีมงานกำลังตรวจสอบข้อมูล
                        </p>
                      </div>
                    )}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex justify-center items-center gap-2 bg-brand-primary hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded w-full font-medium text-sm transition-colors"
                    aria-label="Button"
                  >
                    <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                    <span>
                      {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
                    </span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex justify-center items-center gap-2 bg-zinc-950 hover:bg-zinc-700 px-4 py-2 rounded font-medium text-sm transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>เข้าสู่ระบบ / สมัคร</span>
                </Link>
              )}
            </div>

            <div className="pt-4 border-white/10 border-t">
              <h3 className="px-4 font-semibold text-white/60 text-sm">
                Language
              </h3>
              <div className="grid mt-2">
                <a
                  href="#"
                  className="hover:bg-white/5 px-4 py-2 rounded-md text-white/80"
                >
                  ไทย (TH)
                </a>
                <a
                  href="#"
                  className="hover:bg-white/5 px-4 py-2 rounded-md text-white/80"
                >
                  English (EN)
                </a>
                <a
                  href="#"
                  className="hover:bg-white/5 px-4 py-2 rounded-md text-white/80"
                >
                  日本語 (JP)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
