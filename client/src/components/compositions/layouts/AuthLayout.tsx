"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import { ReactNode } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * Authentication Layout Component
 * Provides a consistent split-screen layout for all auth pages
 * Left side: Hero image with branding
 * Right side: Form content
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  imageSrc = "/assets/images/medical-auth-hero.jpg",
  imageAlt = "Medical Community - ภาพประกอบระบบสมาชิก",
}: AuthLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden justify-center items-center">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes='100%'
          className="object-cover"
          priority
        />

        {/* Back to Home Button - Top Left */}
        <div className="absolute top-6 left-6 z-30">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2  text-sm font-medium transition-all duration-200 hover:scale-105 text-zinc-100"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>

        {/* Content Overlay */}
        <div className="w-full h-full bg-black/50 absolute top-0 left-0 z-0"></div>
        <div className="relative z-20 flex flex-col justify-center items-center text-center p-8 text-zinc-100">
          <div className="max-w-sm">
            <h1 className="text-3xl lg:text-4xl font-semibold mb-4">{title}</h1>
            <p className="text-lg mb-6 leading-relaxed">
              {subtitle || "เพิ่มโอกาสในการเข้าถึงกลุ่มทางการแพทย์ที่ใหญ่ที่สุด"}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-md py-4">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-semibold mb-2">{title}</h1>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>

          {/* Form Content */}
          <div className="bg-white text-zinc-950 shadow-2xl  p-6 border border-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
