"use client";

import { use, useEffect, useState } from "react";
import { Doctor } from '@/components/shared/cards/DoctorCard';
import {
  MapPinIcon,
  UserIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Link } from '@/navigation';
import { notFound } from "next/navigation";
import Image from "next/image";

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        setIsLoading(true);
        // Fetch doctor by slug
        const response = await fetch(`/api/doctors/${slug}`);
        const data = await response.json();

        if (data.success && data.data) {
          setDoctor(data.data);
        } else {
          setError('Doctor not found');
        }
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError('Failed to load doctor');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoctor();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="bg-zinc-100 min-h-screen mt-16 flex items-center justify-center">
        <p className="text-zinc-400 text-xl">กำลังโหลดข้อมูลแพทย์...</p>
      </div>
    );
  }

  if (error || !doctor) {
    notFound();
  }

  const consultationFee = doctor.consultation_fee ?? doctor.price ?? 0;
  const imageUrl = doctor.image || doctor.images?.[0] || "/assets/images/default-avatar.jpg";

  return (
    <div className="bg-zinc-100 min-h-screen mt-16">
      {/* Back Button */}
      <div className="bg-zinc-100 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>กลับไปหน้ารายการแพทย์</span>
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
                {doctor.name}
              </h1>
              {doctor.name_english && (
                <p className="mb-4 text-zinc-400 text-xl">{doctor.name_english}</p>
              )}
              <div className="flex flex-wrap gap-4">
                {doctor.specialization && (
                  <div className="flex items-center gap-2 bg-zinc-100 px-4 py-2 ">
                    <AcademicCapIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-white">{doctor.specialization}</span>
                  </div>
                )}
                {doctor.hospital && (
                  <div className="flex items-center gap-2 bg-zinc-100 px-4 py-2 ">
                    <MapPinIcon className="w-5 h-5 text-green-500" />
                    <span className="text-white">{doctor.hospital}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="relative w-full h-96  overflow-hidden">
              <Image
                src={imageUrl}
                alt={doctor.name || "Doctor image"}
                fill
                sizes='100%'
                className="object-cover"
              />
            </div>

            {/* About Doctor */}
            <div className="bg-zinc-100 p-6 border border-zinc-700 ">
              <h2 className="flex items-center gap-2 mb-4 font-bold text-2xl">
                <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                เกี่ยวกับแพทย์
              </h2>
              <p className="mb-4 text-zinc-300 leading-relaxed">
                {doctor.bio || "ข้อมูลเพิ่มเติมจะประกาศในเร็วๆ นี้"}
              </p>
              {doctor.qualifications && doctor.qualifications.length > 0 && (
                <div className="pt-4 border-zinc-700 border-t">
                  <h3 className="mb-3 font-semibold text-lg">
                    คุณวุฒิ
                  </h3>
                  <ul className="space-y-2 text-zinc-300">
                    {doctor.qualifications.map((qual, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Location */}
            {doctor.location && (
              <div className="bg-zinc-100 p-6 border border-zinc-700 ">
                <h2 className="flex items-center gap-2 mb-4 font-bold text-2xl">
                  <MapPinIcon className="w-6 h-6 text-red-500" />
                  สถานที่ปฏิบัติงาน
                </h2>
                <p className="mb-4 text-zinc-300 text-lg">{doctor.location}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="top-4 sticky space-y-6">
              {/* Consultation Fee */}
              <div className="bg-zinc-100 p-6 border border-zinc-700 ">
                <h3 className="flex items-center gap-2 mb-4 font-bold text-xl">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
                  ค่าคำปรึกษา
                </h3>
                <div className="space-y-4">
                  {consultationFee > 0 ? (
                    <div>
                      <p className="mb-1 text-zinc-400 text-xs">ราคาเริ่มต้น</p>
                      <p className="font-bold text-red-500 text-3xl">
                        ฿{consultationFee.toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-zinc-400">ติดต่อสอบถามราคา</p>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-zinc-100 p-6 border border-zinc-700 ">
                <h3 className="mb-4 font-bold text-xl">
                  ข้อมูลด่วน
                </h3>
                <div className="space-y-4">
                  {doctor.specialization && (
                    <div>
                      <p className="mb-1 text-zinc-400 text-xs">สาขา</p>
                      <p className="text-zinc-300 text-sm">{doctor.specialization}</p>
                    </div>
                  )}
                  {doctor.hospital && (
                    <div>
                      <p className="mb-1 text-zinc-400 text-xs">โรงพยาบาล</p>
                      <p className="text-zinc-300 text-sm">{doctor.hospital}</p>
                    </div>
                  )}
                  {doctor.experience_years && (
                    <div>
                      <p className="mb-1 text-zinc-400 text-xs">ประสบการณ์</p>
                      <p className="text-zinc-300 text-sm">{doctor.experience_years} ปี</p>
                    </div>
                  )}
                  {doctor.location && (
                    <div>
                      <p className="mb-1 text-zinc-400 text-xs">สถานที่</p>
                      <p className="text-zinc-300 text-sm">{doctor.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-linear-to-r from-red-600 to-red-700 p-6  text-center">
                <h3 className="mb-2 font-bold text-xl">
                  ต้องการนัดหมาย?
                </h3>
                <p className="mb-4 text-white/80 text-sm">
                  ติดต่อโรงพยาบาลเพื่อนัดหมาย
                </p>
                {doctor.hospital && (
                  <Link
                    href={`/hospitals?search=${encodeURIComponent(doctor.hospital)}`}
                    className="block bg-white hover:bg-zinc-100 px-6 py-3  w-full font-semibold text-red-600 transition-colors"
                  >
                    ดูโรงพยาบาล
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

