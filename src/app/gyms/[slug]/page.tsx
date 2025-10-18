"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Gym } from "@/types/database.types";
import {
  MapPinIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function GymDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGym() {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) {
        console.error('Error fetching gym:', error);
      }

      setGym(data);
      setIsLoading(false);
    }

    fetchGym();
  }, [slug, supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-900 min-h-screen">
        <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!gym) {
    notFound();
  }

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Breadcrumb & Back Button */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-3 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <HomeIcon className="w-4 h-4" />
              <span>หน้าแรก</span>
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
            <Link
              href="/gyms"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ค่ายมวย
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
            <span className="font-medium text-white">
              {gym.gym_name}
            </span>
          </nav>

          {/* Back Button */}
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
                    {gym.gym_name}
                  </h1>
                  {gym.gym_name_english && (
                    <p className="text-zinc-400 text-xl">
                      {gym.gym_name_english}
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

              {gym.gym_type && (
                <span className="inline-block bg-red-600 px-3 py-1 rounded-full font-semibold text-white text-sm">
                  {gym.gym_type}
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
                {gym.gym_details || "ไม่มีรายละเอียดเพิ่มเติม"}
              </p>
            </div>

            {/* Location */}
            <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
              <h2 className="mb-4 font-bold text-white text-2xl">
                ที่อยู่และแผนที่
              </h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPinIcon className="flex-shrink-0 w-6 h-6 text-red-500" />
                <p className="text-zinc-300">{gym.location}</p>
              </div>
              {gym.map_url && (
                <a
                  href={gym.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-white transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5" />
                  <span>เปิดใน Google Maps</span>
                </a>
              )}
            </div>

            {/* Services */}
            {gym.services && gym.services.length > 0 && (
              <div className="bg-zinc-800 p-6 border border-zinc-700 rounded-lg">
                <h2 className="mb-4 font-bold text-white text-2xl">
                  บริการ
                </h2>
                <div className="flex flex-wrap gap-2">
                  {gym.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="bg-zinc-700 px-3 py-1 rounded-full text-zinc-300 text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Packages - Commented out until we have packages table */}
            {/* {gym.packages && gym.packages.length > 0 && (
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
            )} */}
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
                  {gym.phone && (
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-green-500" />
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">
                          โทรศัพท์
                        </p>
                        <a
                          href={`tel:${gym.phone}`}
                          className="text-zinc-300 hover:text-white transition-colors"
                        >
                          {gym.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {gym.email && (
                    <div className="flex items-start gap-3">
                      <EnvelopeIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-500" />
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">อีเมล</p>
                        <a
                          href={`mailto:${gym.email}`}
                          className="text-zinc-300 hover:text-white break-all transition-colors"
                        >
                          {gym.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {gym.website && (
                    <div className="flex items-start gap-3">
                      <GlobeAltIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
                      <div>
                        <p className="mb-1 text-zinc-400 text-xs">
                          เว็บไซต์
                        </p>
                        <a
                          href={gym.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-300 hover:text-white break-all transition-colors"
                        >
                          {gym.website}
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
                  {gym.contact_name && (
                    <div className="pt-4 border-zinc-700 border-t">
                      <p className="mb-1 text-zinc-400 text-xs">
                        ผู้ติดต่อ
                      </p>
                      <p className="text-zinc-300">{gym.contact_name}</p>
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
                  {gym.rating && (
                    <div className="flex items-center gap-3">
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-zinc-400 text-xs">คะแนน</p>
                        <p className="font-semibold text-zinc-300">
                          {gym.rating.toFixed(1)} / 5.0
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-zinc-400 text-xs">เวลาทำการ</p>
                      <p className="text-zinc-300">จันทร์-เสาร์: 06:00-20:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-zinc-400 text-xs">ราคา</p>
                      <p className="font-semibold text-zinc-300">
                        ติดต่อสอบถาม
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg text-center">
                <h3 className="mb-2 font-bold text-white text-xl">
                  ต้องการใช้บริการค่ายมวย
                </h3>
                <Link
                  href={`/gyms/${gym.slug}/booking`}
                  className="block bg-white hover:bg-zinc-100 px-6 py-3 rounded-lg w-full font-semibold text-red-600 transition-colors"
                >
                  จองค่ายมวย
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

