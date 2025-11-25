"use client";

import Link from "next/link";
import { hospital } from '@shared/types';
import { HospitalCard } from "@/components/shared";

interface FeaturedSectionProps {
  hospitals: hospital[];
}

export default function FeaturedSection({
  hospitals,
}: FeaturedSectionProps) {
  return (
    <section className="py-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl text-gray-900">
            ค้นหาบริการทางการแพทย์
          </h2>
          <p className="text-gray-600 text-lg">
            ค้นพบโรงพยาบาลชั้นนำที่ให้บริการทางการแพทย์
          </p>
        </div>

        {/* Content */}
        <div 
          className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {hospitals.slice(0, 3).map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/hospitals"
            className="inline-block bg-brand-primary hover:bg-[#8B5CF6] text-white px-8 py-3  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 font-semibold transition-colors shadow-lg hover:shadow-xl"
            aria-label="ดูโรงพยาบาลทั้งหมด"
          >
            ดูโรงพยาบาลทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  );
}
