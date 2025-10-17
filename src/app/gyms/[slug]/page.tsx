"use client";

import { use } from "react";
import { GYMS } from "@/lib/data";
import {
  MapPinIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function GymDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const gym = GYMS.find((g) => g.slug === slug);

  if (!gym) {
    notFound();
  }

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Back Button */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <Link
            href="/gyms"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>กลับไปหน้ารายการค่ายมวย</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Header */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="mb-2 font-bold text-white text-4xl">
                    {gym.gymNameThai}
                  </h1>
                  {gym.gymNameEnglish && (
                    <p className="text-zinc-400 text-xl">
                      {gym.gymNameEnglish}
                    </p>
                  )}
                </div>
                {gym.rating && (
                  <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg">
                    <StarIcon className="fill-yellow-400 w-6 h-6 text-yellow-400" />
                    <span className="font-bold text-white text-2xl">
                      {gym.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {gym.gymType && (
                <span className="inline-block bg-red-600 px-3 py-1 rounded-full font-semibold text-white text-sm">
                  {gym.gymType}
                </span>
              )}
            </div>

            {/* Image Gallery Placeholder */}
            <div className="flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-lg h-96">
              <div className="text-center">
                <div className="mb-4 text-zinc-600 text-9xl">🥊</div>
                <p className="text-zinc-400">ภาพประกอบจะมาเร็วๆ นี้</p>
              </div>
            </div>

            {/* About */}
            <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
              <h2 className="mb-4 font-bold text-white text-2xl">
                เกี่ยวกับค่ายมวย
              </h2>
              <p className="text-zinc-300 leading-relaxed">
                {gym.details || "ไม่มีรายละเอียดเพิ่มเติม"}
              </p>
            </div>

            {/* Location */}
            <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
              <h2 className="mb-4 font-bold text-white text-2xl">
                ที่อยู่และแผนที่
              </h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPinIcon className="flex-shrink-0 w-6 h-6 text-red-500" />
                <p className="text-zinc-300">{gym.address}</p>
              </div>
              {gym.mapUrl && (
                <a
                  href={gym.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-white transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5" />
                  <span>เปิดใน Google Maps</span>
                </a>
              )}
            </div>

            {/* Packages */}
            {gym.packages && gym.packages.length > 0 && (
              <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
                <h2 className="mb-4 font-bold text-white text-2xl">
                  แพ็คเกจการฝึกซ้อม
                </h2>
                <div className="space-y-4">
                  {gym.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-zinc-900 p-4 border border-zinc-700 hover:border-red-500 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="mb-1 font-semibold text-white text-xl">
                            {pkg.name}
                          </h3>
                          <p className="text-zinc-400 text-sm">
                            {pkg.duration_days} วัน
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500 text-2xl">
                            ฿{pkg.base_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {pkg.description && (
                        <p className="mb-3 text-zinc-400 text-sm">
                          {pkg.description}
                        </p>
                      )}
                      {pkg.inclusions && pkg.inclusions.length > 0 && (
                        <div className="space-y-2">
                          {pkg.inclusions.map((inclusion, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-zinc-300 text-sm"
                            >
                              <CheckCircleIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                              <span>{inclusion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="top-4 sticky space-y-6">
              {/* Contact Info */}
              <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
                <h3 className="mb-4 font-bold text-white text-xl">
                  ข้อมูลติดต่อ
                </h3>
                <div className="space-y-4">
                  {gym.ownerPhone && (
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-green-500" />
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">
                          โทรศัพท์
                        </p>
                        <a
                          href={`tel:${gym.ownerPhone}`}
                          className="text-zinc-300 hover:text-white transition-colors"
                        >
                          {gym.ownerPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {gym.ownerEmail && (
                    <div className="flex items-start gap-3">
                      <EnvelopeIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-500" />
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">อีเมล</p>
                        <a
                          href={`mailto:${gym.ownerEmail}`}
                          className="text-zinc-300 hover:text-white break-all transition-colors"
                        >
                          {gym.ownerEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {gym.socials && (
                    <div className="flex items-start gap-3">
                      <GlobeAltIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">
                          โซเชียลมีเดีย
                        </p>
                        <p className="text-zinc-300">{gym.socials}</p>
                      </div>
                    </div>
                  )}
                  {gym.ownerName && (
                    <div className="pt-4 border-zinc-700 border-t">
                      <p className="mb-1 text-zinc-400 text-xs">
                        เจ้าของ/ผู้ดูแล
                      </p>
                      <p className="text-zinc-300">{gym.ownerName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
                <h3 className="mb-4 font-bold text-white text-xl">
                  ข้อมูลทั่วไป
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-zinc-400 text-xs">ราคาเริ่มต้น</p>
                      <p className="font-semibold text-zinc-300">
                        {gym.packages && gym.packages.length > 0
                          ? `฿${Math.min(
                              ...gym.packages.map((p) => p.base_price)
                            ).toLocaleString()}`
                          : "ติดต่อสอบถาม"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-zinc-400 text-xs">เวลาทำการ</p>
                      <p className="text-zinc-300">จันทร์-เสาร์: 06:00-20:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg text-center">
                <h3 className="mb-2 font-bold text-white text-xl">
                  พร้อมที่จะเริ่มต้น?
                </h3>
                <p className="mb-4 text-white/80 text-sm">
                  ติดต่อค่ายมวยเพื่อจองและสอบถามข้อมูลเพิ่มเติม
                </p>
                {gym.ownerPhone ? (
                  <a
                    href={`tel:${gym.ownerPhone}`}
                    className="block bg-white hover:bg-zinc-100 px-6 py-3 rounded-lg w-full font-semibold text-red-600 transition-colors"
                  >
                    โทรติดต่อเลย
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    className="block bg-white hover:bg-zinc-100 px-6 py-3 rounded-lg w-full font-semibold text-red-600 transition-colors"
                  >
                    ติดต่อเรา
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

