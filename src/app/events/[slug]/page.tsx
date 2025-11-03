"use client";

import { use } from "react";
import { EVENTS } from "@/lib/data";
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  TicketIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const event = EVENTS.find((e) => e.slug === slug);

  if (!event) {
    notFound();
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-zinc-950 min-h-screen mt-16">
      {/* Back Button */}
      <div className="bg-zinc-950 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>กลับไปหน้ารายการอีเวนต์</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Header */}
            <div>
              <h1 className="mb-4 font-bold text-4xl">
                {event.name}
              </h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-white">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-green-500" />
                  <span className="text-white">{formattedTime}</span>
                </div>
              </div>
            </div>

            {/* Image Gallery Placeholder */}
            <div className="flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-950 rounded-lg h-96">
              <div className="text-center">
                <div className="mb-4 text-zinc-600 text-9xl">🥊</div>
                <p className="text-zinc-400">ภาพประกอบจะมาเร็วๆ นี้</p>
              </div>
            </div>

            {/* About Event */}
            <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
              <h2 className="flex items-center gap-2 mb-4 font-bold text-2xl">
                <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                รายละเอียดอีเวนต์
              </h2>
              <p className="mb-4 text-zinc-300 leading-relaxed">
                {event.details || "รายละเอียดเพิ่มเติมจะประกาศในเร็วๆ นี้"}
              </p>
              <div className="pt-4 border-zinc-700 border-t">
                <h3 className="mb-3 font-semibold text-lg">
                  ไฮไลท์ของอีเวนต์
                </h3>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>การแข่งขันมวยไทยระดับมืออาชีพ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>นักมวยชั้นนำจากทั่วประเทศ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>บรรยากาศที่น่าตื่นเต้นและเร้าใจ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>สิ่งอำนวยความสะดวกครบครัน</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Location */}
            <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
              <h2 className="flex items-center gap-2 mb-4 font-bold text-2xl">
                <MapPinIcon className="w-6 h-6 text-red-500" />
                สถานที่จัดงาน
              </h2>
              <p className="mb-4 text-zinc-300 text-lg">{event.location}</p>
              <div className="bg-zinc-950 p-4 border border-zinc-700 rounded-lg">
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <MapPinIcon className="mx-auto mb-2 w-12 h-12 text-zinc-600" />
                    <p className="text-zinc-400 text-sm">แผนที่จะมาเร็วๆ นี้</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
              <h2 className="mb-4 font-bold text-2xl">
                ข้อมูลสำคัญ
              </h2>
              <div className="space-y-3 text-zinc-300 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>
                    กรุณามาถึงสถานที่จัดงานก่อนเวลาอย่างน้อย 30 นาที
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>เด็กอายุต่ำกว่า 12 ปี ต้องมีผู้ปกครองดูแล</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>ห้ามนำอาหารและเครื่องดื่มจากภายนอกเข้ามา</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>สามารถคืนตั๋วได้ก่อนวันจัดงาน 7 วัน</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="top-4 sticky space-y-6">
              {/* Ticket Info */}
              <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
                <h3 className="flex items-center gap-2 mb-4 font-bold text-xl">
                  <TicketIcon className="w-6 h-6 text-green-500" />
                  ข้อมูลตั๋ว
                </h3>
                <div className="space-y-4">
                  {event.price ? (
                    <>
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">ราคาเริ่มต้น</p>
                        <p className="font-bold text-red-500 text-3xl">
                          ฿{event.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-4 border-zinc-700 border-t">
                        <UserGroupIcon className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-zinc-400 text-xs">สถานะ</p>
                          <p className="font-semibold text-green-400 text-sm">
                            มีที่นั่งว่าง
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-zinc-400">ติดต่อสอบถามราคา</p>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
                <h3 className="mb-4 font-bold text-xl">
                  ข้อมูลด่วน
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-zinc-400 text-xs">วันที่</p>
                    <p className="text-zinc-300 text-sm">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-zinc-400 text-xs">เวลา</p>
                    <p className="text-zinc-300 text-sm">{formattedTime}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-zinc-400 text-xs">สถานที่</p>
                    <p className="text-zinc-300 text-sm">{event.location}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg text-center">
                <h3 className="mb-2 font-bold text-xl">
                  พร้อมจองตั๋วแล้ว?
                </h3>
                <p className="mb-4 text-white/80 text-sm">
                  อย่าพลาดการแข่งขันที่น่าตื่นเต้น!
                </p>
                <Link
                  href="/contact"
                  className="block bg-white hover:bg-zinc-100 px-6 py-3 rounded-lg w-full font-semibold text-red-600 transition-colors"
                >
                  จองตั๋วเลย
                </Link>
                <p className="mt-3 text-white/60 text-xs">
                  หรือติดต่อสอบถามเพิ่มเติม
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

