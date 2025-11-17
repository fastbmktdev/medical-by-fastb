"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { AuthLayout } from "@/components/compositions/layouts";
import { Button } from "@/components/shared";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

/**
 * Content component that uses useSearchParams
 * Must be wrapped in Suspense boundary
 */
function VerificationPendingContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams?.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <AuthLayout
      title="ยืนยันอีเมลของคุณ"
      subtitle="เราได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว"
    >
      <div className="space-y-6 pl-4">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center">
              <EnvelopeIcon className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">ลงทะเบียนสำเร็จ!</h2>

          {email && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <p className="text-zinc-300 text-sm mb-2">
                เราได้ส่งอีเมลยืนยันไปที่:
              </p>
              <p className="text-white font-semibold break-all">{email}</p>
            </div>
          )}

          <p className="text-yellow-300 text-sm">
            ⚠️ <span className="font-semibold">หมายเหตุ:</span> หากไม่พบอีเมล
            กรุณาตรวจสอบในโฟลเดอร์ Spam หรือ Junk Mail
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link href="/login">
            <Button
              fullWidth
              size="lg"
              className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 mb-4"
            >
              ไปที่หน้าเข้าสู่ระบบ
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="ghost"
              fullWidth
              size="lg"
              className="text-zinc-300 hover:text-white"
            >
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center pt-4 border-t border-zinc-700">
          <p className="text-zinc-400 text-sm mb-2">ไม่ได้รับอีเมล?</p>
          <p className="text-zinc-500 text-xs">
            กรุณารอสักครู่แล้วลองตรวจสอบอีกครั้ง
            <br />
            หรือติดต่อทีมสนับสนุนได้ที่{" "}
            <a
              href="mailto:thaikickmuaythai@gmail.com"
              className="text-red-400 hover:text-red-300 underline"
            >
              thaikickmuaythai@gmail.com
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

/**
 * Email Verification Pending Page
 *
 * แสดงหน้าแจ้งเตือนให้ผู้ใช้ไปยืนยันอีเมล
 * พร้อมปุ่มไปหน้า login
 */
export default function VerificationPendingPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout
          title="ยืนยันอีเมลของคุณ"
          subtitle="เราได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว"
        >
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </AuthLayout>
      }
    >
      <VerificationPendingContent />
    </Suspense>
  );
}
