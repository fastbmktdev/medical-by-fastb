"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isInfoMenuOpen, setInfoMenuOpen] = useState(false);

  const [currentLang, setCurrentLang] = useState("TH");

  const navLinks: NavLink[] = [
    { text: "ค่ายมวย", href: "/gyms" },
    { text: "ตั๋วชกมวย", href: "/events" },
    { text: "โปรแกรม", href: "/fighter-program" },
    { text: "ร้านค้า", href: "/shop" },
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
    <header className="top-0 z-[5000] sticky bg-background/60 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-white/10 border-b h-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          <div className="flex justify-center items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex justify-center items-center bg-red-600 rounded w-8 h-8 font-bold text-white">
                MT
              </span>
              <span className="font-semibold text-base sm:text-lg">
                MUAYTHAI NEXT
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm">
              {navLinks.map((link) =>
                link.dropdown ? (
                  <div key={link.text} className="relative">
                    <button
                      onClick={() => setInfoMenuOpen((o) => !o)}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                      {link.text}
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {isInfoMenuOpen && (
                      <div className="right-0 absolute bg-zinc-800 shadow-lg mt-2 border border-white/10 rounded-md w-48">
                        <div className="py-1">
                          {link.dropdown.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block hover:bg-white/5 px-4 py-2 text-white/80 text-sm"
                              onClick={() => setInfoMenuOpen(false)}
                            >
                              {item.text}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
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

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen((o) => !o)}
                className="hidden md:inline-flex justify-center items-center hover:bg-white/5 border border-white/20 rounded w-12 h-10 font-semibold text-sm"
              >
                {currentLang}
              </button>
              {isLangDropdownOpen && (
                <div className="right-0 absolute bg-zinc-800 shadow-lg mt-2 border border-white/10 rounded-md w-32">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setCurrentLang("TH");
                        setLangDropdownOpen(false);
                      }}
                      className="block hover:bg-white/5 px-4 py-2 w-full text-white/80 text-sm text-left"
                    >
                      ไทย (TH)
                    </button>
                    <button
                      onClick={() => {
                        setCurrentLang("EN");
                        setLangDropdownOpen(false);
                      }}
                      className="block hover:bg-white/5 px-4 py-2 w-full text-white/80 text-sm text-left"
                    >
                      English (EN)
                    </button>
                    <button
                      onClick={() => {
                        setCurrentLang("JP");
                        setLangDropdownOpen(false);
                      }}
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
        <div className="md:hidden bg-background/80 border-white/10 border-t">
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

            <div className="pt-4 border-white/10 border-t">
              <Link
                href="/login"
                className="flex justify-center items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded font-medium text-white text-sm transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>เข้าสู่ระบบ / สมัคร</span>
              </Link>
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
