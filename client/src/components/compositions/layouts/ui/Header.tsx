"use client";

import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { useState, useEffect, Fragment } from "react";
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
} from "@shared/lib/auth/client";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

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

// Utility Nav rendering
function NavLinks({
  links,
  isMobile = false,
  onNavClick,
}: {
  links: NavLink[];
  isMobile?: boolean;
  onNavClick?: () => void;
}) {
  return (
    <>
      {links.map((link) =>
        link.dropdown ? (
          <div key={link.text} className={isMobile ? "" : "relative group"}>
            {isMobile ? (
              <>
                <p className="px-4 font-semibold text-gray-600">{link.text}</p>
                <div className="grid mt-1">
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="hover:bg-gray-100 px-4 py-2  text-gray-700"
                      onClick={onNavClick}
                    >
                      {item.text}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer text-zinc-950">
                  {link.text}
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-0 bg-white shadow-lg border border-gray-200  w-48 z-50">
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block hover:bg-gray-100 px-4 py-2 text-gray-700 text-sm"
                    >
                      {item.text}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className={
              isMobile
                ? "hover:bg-white/5 -mx-4 px-4 py-2  hover:text-purple-500"
                : "hover:text-purple-500 transition-colors"
            }
            onClick={onNavClick}
          >
            {link.text}
          </Link>
        )
      )}
    </>
  );
}

// Desktop User Menu
function DesktopUserMenu({
  user,
  userRole,
  applicationStatus,
  handleLogout,
  isLoggingOut,
}: {
  user: any;
  userRole: UserRole | null;
  applicationStatus: string | null;
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
}) {
  return (
    <div className="hidden md:block relative group">
      <div className="flex items-center gap-2 hover:bg-gray-100 px-3 border border-gray-300  h-10 transition-all duration-200 cursor-pointer">
        <UserCircleIcon className="w-5 h-5 group-hover:text-purple-600 transition-colors text-zinc-950" />
        <span className="max-w-[100px] text-sm truncate group-hover:text-zinc-950 transition-colors text-zinc-950">
          {user.user_metadata?.full_name || user.email?.split("@")[0]}
        </span>
        <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180 text-zinc-950" />
      </div>
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 right-0 absolute bg-white backdrop-blur-md shadow-2xl border border-gray-200  w-64 z-50 overflow-hidden">
        {/* User Info */}
        <div className="px-4 py-3 border-gray-200 border-b bg-gray-50">
          <p className="font-semibold text-sm truncate text-zinc-950">
            {user.user_metadata?.full_name || "ผู้ใช้งาน"}
          </p>
          <p className="text-gray-600 text-xs truncate mt-1">{user.email}</p>
          {userRole && (
            <div className="flex items-center gap-1 mt-2">
              <span className="inline-block bg-purple-100 px-3 py-1  text-purple-600 text-xs font-medium border border-purple-200">
                {ROLE_NAMES[userRole]}
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Link */}
        {userRole && (
          <Link
            href={getDashboardPath(userRole)}
            className="group flex items-center gap-3 hover:bg-purple-50 px-4 py-3 text-gray-700 hover:text-zinc-950 text-sm transition-all duration-200"
          >
            {userRole === "admin" && (
              <ShieldCheckIcon className="w-5 h-5 group-hover:text-purple-600 transition-colors" />
            )}
            {userRole === "partner" && (
              <BuildingStorefrontIcon className="w-5 h-5 group-hover:text-purple-600 transition-colors" />
            )}
            {userRole === "authenticated" && (
              <HomeIcon className="w-5 h-5 group-hover:text-purple-600 transition-colors" />
            )}
            <span className="font-medium">แดชบอร์ด</span>
          </Link>
        )}

        {/* Apply for Partner */}
        {userRole === "authenticated" && !applicationStatus && (
          <Link
            href="/partner/apply"
            className="group flex items-center gap-3 hover:bg-blue-50 px-4 py-3 text-gray-700 hover:text-zinc-950 text-sm transition-all duration-200"
          >
            <BuildingStorefrontIcon className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
            <span className="font-medium">สมัคร Partner</span>
          </Link>
        )}

        {/* Pending Status */}
        {userRole === "authenticated" && applicationStatus === "pending" && (
          <div className="px-4 py-3 border-gray-200 border-t bg-yellow-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500  animate-pulse"></div>
              <p className="text-yellow-700 text-xs font-medium">
                📋 รอการอนุมัติ Partner
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex items-center gap-3 hover:bg-purple-50 disabled:opacity-50 px-4 py-3 w-full text-gray-700 hover:text-zinc-950 text-sm text-left transition-all duration-200"
          aria-label="ออกจากระบบ"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 group-hover:text-purple-600 transition-colors" />
          <span className="font-medium">
            {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </span>
        </button>
      </div>
    </div>
  );
}

// Mobile User Menu
function MobileUserMenu({
  user,
  userRole,
  applicationStatus,
  handleLogout,
  isLoggingOut,
  onClose,
}: {
  user: any;
  userRole: UserRole | null;
  applicationStatus: string | null;
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
  onClose: () => void;
}) {
  return user ? (
    <div className="space-y-2">
      {/* User Info */}
      <div className="bg-gray-50 px-4 py-3  border border-gray-200">
        <p className="font-medium text-sm truncate text-zinc-950">
          {user.user_metadata?.full_name || "ผู้ใช้งาน"}
        </p>
        <p className="text-gray-600 text-xs truncate">{user.email}</p>
        {userRole && (
          <div className="flex items-center gap-1 mt-2">
            <span className="inline-block bg-purple-100 px-2 py-0.5  text-purple-600 text-xs border border-purple-200">
              {ROLE_NAMES[userRole]}
            </span>
          </div>
        )}
      </div>

      {/* Dashboard Link */}
      {userRole && (
        <Link
          href={getDashboardPath(userRole)}
          className="flex items-center gap-2 bg-white hover:bg-gray-100 px-4 py-2  font-medium text-sm transition-colors text-zinc-950 border border-gray-200"
          onClick={onClose}
        >
          {userRole === "admin" && <ShieldCheckIcon className="w-5 h-5" />}
          {userRole === "partner" && (
            <BuildingStorefrontIcon className="w-5 h-5" />
          )}
          {userRole === "authenticated" && <HomeIcon className="w-5 h-5" />}
          <span>แดชบอร์ด</span>
        </Link>
      )}

      {/* Apply for Partner */}
      {userRole === "authenticated" && !applicationStatus && (
        <Link
          href="/partner/apply"
          className="flex items-center gap-2 bg-white hover:bg-gray-100 px-4 py-2  font-medium text-sm transition-colors text-zinc-950 border border-gray-200"
          onClick={onClose}
        >
          <BuildingStorefrontIcon className="w-5 h-5" />
          <span>สมัคร Partner</span>
        </Link>
      )}

      {/* Pending Status */}
      {userRole === "authenticated" && applicationStatus === "pending" && (
        <div className="bg-yellow-500/20 px-4 py-3 border border-yellow-500/30 ">
          <p className="font-medium text-sm">📋 รอการอนุมัติ Partner</p>
          <p className="mt-1 text-yellow-400 text-xs">
            ทีมงานกำลังตรวจสอบข้อมูล
          </p>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex justify-center items-center gap-2 bg-brand-primary hover:bg-[#8B5CF6] disabled:bg-purple-400 px-4 py-2  w-full font-medium text-sm transition-colors"
        aria-label="ออกจากระบบ"
      >
        <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
        <span>{isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
      </button>
    </div>
  ) : (
    <Link
      href="/login"
      className="flex justify-center items-center gap-2 bg-white hover:bg-gray-100 px-4 py-2  font-medium text-sm transition-colors text-zinc-950 border border-gray-200"
      onClick={onClose}
    >
      <UserCircleIcon className="w-5 h-5" />
      <span>เข้าสู่ระบบ / สมัคร</span>
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const locale = useLocale();
  const { user, signOut } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);

        const supabase = (
          await import("@shared/lib/database/supabase/client")
        ).createClient();
        const { data: hospitalData } = await supabase
          .from("hospitals")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        setApplicationStatus(hospitalData?.status || null);
      } else {
        setUserRole(null);
        setApplicationStatus(null);
      }
    }
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsMobileMenuOpen(false);
    setIsLoggingOut(false);
    router.push(`/${locale}`);
    router.refresh();
  };

  const navLinks: NavLink[] = [
    { text: "โรงพยาบาล", href: "/hospitals" },
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
    <header className="top-0 z-5000 fixed bg-white/75 supports-backdrop-filter:bg-white/60 backdrop-blur border-white/10 border-b w-screen h-16 text-zinc-950">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Nav */}
          <div className="flex justify-center items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex justify-center items-center bg-brand-primary w-8 h-8 font-bold text-white ">
                MP
              </span>
              <span className="font-semibold text-base sm:text-lg">
                Medical Platform
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <NavLinks links={navLinks} />
            </nav>
          </div>

          {/* Actions (User, Lang, Toggle mobile menu) */}
          <div className="flex items-center gap-2">
            {user ? (
              <DesktopUserMenu
                user={user}
                userRole={userRole}
                applicationStatus={applicationStatus}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 bg-brand-primary hover:bg-[#8B5CF6] px-4  h-10 font-medium text-sm transition-colors"
              >
                <UserCircleIcon className="w-5 h-5" />
                เข้าสู่ระบบ
              </Link>
            )}

            <LanguageSwitcher />

            <button
              aria-label="Toggle menu"
              className="md:hidden inline-flex justify-center items-center hover:bg-gray-100 border border-gray-300  w-10 h-10 text-zinc-950"
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
        <div className="md:hidden bg-white border-gray-200 border-t">
          <div className="gap-4 grid mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl text-sm">
            <NavLinks
              links={navLinks}
              isMobile
              onNavClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Mobile User & Lang */}
            <div className="pt-4 border-white/10 border-t">
              <MobileUserMenu
                user={user}
                userRole={userRole}
                applicationStatus={applicationStatus}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
