"use client";

import { CheckCircleIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { use } from "react";

export default function BookingSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <div className="flex justify-center items-center bg-zinc-900 px-4 min-h-screen">
      <div className="bg-zinc-800 shadow-2xl mx-auto p-8 md:p-12 border border-zinc-700 rounded-2xl max-w-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-600 p-4 rounded-full">
            <CheckCircleIcon className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="mb-4 font-bold text-white text-4xl">
          จองสำเร็จ!
        </h1>
        
        <p className="mb-6 text-zinc-300 text-xl">
          ขอบคุณที่เลือกใช้บริการของเรา
        </p>

        <div className="bg-zinc-700/50 mb-8 p-6 rounded-lg">
          <p className="mb-2 text-zinc-400 text-sm">
            เราได้รับการจองของคุณเรียบร้อยแล้ว
          </p>
          <p className="text-zinc-300">
            ทางค่ายมวยจะติดต่อกลับภายใน 24 ชั่วโมง เพื่อยืนยันรายละเอียดการจอง
          </p>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-zinc-400 text-sm">
            ข้อมูลการจองถูกส่งไปยังอีเมลของคุณแล้ว
          </p>
          <p className="text-zinc-300 text-sm">
            กรุณาตรวจสอบกล่องข้อความ (และโฟลเดอร์สแปมด้วย)
          </p>
        </div>

        <div className="flex sm:flex-row flex-col justify-center gap-4">
          <Link
            href={`/gyms/${slug}`}
            className="inline-flex justify-center items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          >
            กลับไปหน้าค่ายมวย
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            กลับหน้าแรก
          </Link>
        </div>

        <div className="mt-8 pt-8 border-zinc-700 border-t">
          <p className="text-zinc-400 text-sm">
            หากมีคำถามเพิ่มเติม กรุณาติดต่อ{" "}
            <Link href="/contact" className="text-red-500 hover:text-red-400 underline">
              ฝ่ายบริการลูกค้า
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

