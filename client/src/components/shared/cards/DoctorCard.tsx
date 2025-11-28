"use client";

import {
  MapPinIcon,
  UserIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Link } from '@/navigation';
import Image from "next/image";
import { memo } from "react";
import { BaseCard } from "./BaseCard";

type ViewMode = "list" | "grid";

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  name_english?: string | null;
  specialization?: string | null;
  hospital?: string | null;
  location?: string | null;
  consultation_fee?: number | null;
  price?: number; // Legacy field for backward compatibility
  image?: string | null;
  images?: string[] | null;
  bio?: string | null;
  experience_years?: number | null;
  qualifications?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  viewMode: ViewMode;
}

function DoctorCardComponent({ doctor, viewMode }: DoctorCardProps) {
  const consultationFee = doctor.consultation_fee ?? doctor.price;
  const imageUrl = doctor.image || doctor.images?.[0] || "/assets/images/fallback-img.jpg";
  const displayLocation = doctor.hospital || doctor.location || "";

  if (viewMode === "list") {
    return (
      <BaseCard className="p-6">
        <div className="flex sm:flex-row flex-col justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="mb-2 font-semibold group-hover:text-purple-400 text-xl transition-colors">
              {doctor.name}
            </h3>
            <div className="space-y-2">
              {doctor.specialization && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <AcademicCapIcon className="shrink-0 w-4 h-4 text-blue-500" />
                  <span>{doctor.specialization}</span>
                </div>
              )}
              {displayLocation && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <MapPinIcon className="shrink-0 w-4 h-4 text-purple-500" />
                  <span>{displayLocation}</span>
                </div>
              )}
              {doctor.experience_years && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <UserIcon className="shrink-0 w-4 h-4 text-green-500" />
                  <span>ประสบการณ์ {doctor.experience_years} ปี</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href={`/doctors/${doctor.slug}`}
              className="sm:flex-initial flex-1 bg-zinc-100 hover:bg-zinc-600 px-4 py-2  font-semibold text-sm text-center transition-colors"
            >
              ดูรายละเอียด
            </Link>
            <Link
              href={`/doctors/${doctor.slug}`}
              className="sm:flex-initial flex-1 bg-brand-primary hover:bg-[#8B5CF6] px-4 py-2  font-semibold text-sm text-center transition-colors"
            >
              จองนัดหมาย
            </Link>
          </div>
        </div>
      </BaseCard>
    );
  }

  // Grid view
  return (
    <BaseCard>
      <div className="relative w-full h-1/3">
        <Image
          src={imageUrl}
          alt={doctor.name || "Doctor image"}
          fill
          sizes='100%'
          className="object-cover"
        />
        {consultationFee && (
          <div className="top-2 right-2 absolute flex items-center gap-1 bg-black/50 px-3 py-1 ">
            <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
            <span className="font-semibold text-sm">
              ฿{consultationFee.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="relative h-2/3 p-6">
        <h3 className="mb-3 font-semibold group-hover:text-purple-400 text-xl transition-colors">
          {doctor.name}
        </h3>

        <div className="space-y-2 mb-4">
          {doctor.specialization && (
            <div className="flex items-start gap-2 text-zinc-400 text-sm">
              <AcademicCapIcon className="shrink-0 mt-0.5 w-4 h-4 text-blue-500" />
              <span className="line-clamp-1">{doctor.specialization}</span>
            </div>
          )}
          {displayLocation && (
            <div className="flex items-start gap-2 text-zinc-400 text-sm">
              <MapPinIcon className="shrink-0 mt-0.5 w-4 h-4 text-purple-500" />
              <span className="line-clamp-1">{displayLocation}</span>
            </div>
          )}
          {doctor.experience_years && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <UserIcon className="shrink-0 w-4 h-4 text-green-500" />
              <span>ประสบการณ์ {doctor.experience_years} ปี</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="flex-1 bg-zinc-100 hover:bg-zinc-600 py-2  font-semibold text-sm text-center transition-colors"
          >
            ดูรายละเอียด
          </Link>
          <Link
            href={`/doctors/${doctor.slug}`}
            className="flex-1 bg-brand-primary hover:bg-[#8B5CF6] py-2  font-semibold text-sm text-center transition-colors"
          >
            จองนัดหมาย
          </Link>
        </div>
      </div>
    </BaseCard>
  );
}

export const DoctorCard = memo(DoctorCardComponent);