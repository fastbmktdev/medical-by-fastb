"use client";

import { useState } from "react";
import { GYMS } from "@/lib/data";
import { Gym } from "@/types/app.types";
import {
  MapPinIcon,
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function GymsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Filter gyms based on search and type
  const filteredGyms = GYMS.filter((gym) => {
    const matchesSearch =
      gym.gymNameThai.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.gymNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "all" || gym.gymType === selectedType;

    return matchesSearch && matchesType;
  });

  const gymTypes = ["all", ...new Set(GYMS.map((gym) => gym.gymType).filter(Boolean))];

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-white text-4xl">
              ค่ายมวยไทย
            </h1>
            <p className="mx-auto max-w-3xl text-zinc-300 text-xl">
              ค้นหาและจองค่ายมวยไทยที่เหมาะกับคุณ จากค่ายชั้นนำทั่วประเทศไทย
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="ค้นหาค่ายมวย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-400"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-zinc-800 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white appearance-none cursor-pointer"
              >
                <option value="all">ทุกประเภท</option>
                {gymTypes
                  .filter((type) => type !== "all")
                  .map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-zinc-400">
          พบ {filteredGyms.length} ค่ายมวย
        </div>

        {/* Gyms Grid */}
        {filteredGyms.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 text-xl">
              ไม่พบค่ายมวยที่ตรงกับการค้นหา
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
              className="bg-red-600 hover:bg-red-700 mt-4 px-6 py-2 rounded-lg text-white transition-colors"
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredGyms.map((gym) => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GymCard({ gym }: { gym: Gym }) {
  const minPrice = gym.packages && gym.packages.length > 0
    ? Math.min(...gym.packages.map((p) => p.base_price))
    : null;

  return (
    <div className="group bg-zinc-800 hover:shadow-2xl hover:shadow-red-500/30 border border-zinc-700 hover:border-red-500 rounded-lg overflow-hidden transition-all duration-300">
      {/* Image Placeholder */}
      <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-900 h-48">
        <div className="text-zinc-600 text-6xl">🥊</div>
        {gym.rating && (
          <div className="top-2 right-2 absolute flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
            <StarIcon className="fill-yellow-400 w-4 h-4 text-yellow-400" />
            <span className="font-bold text-white text-sm">
              {gym.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Gym Name */}
        <h3 className="mb-2 font-bold text-white group-hover:text-red-400 text-xl transition-colors">
          {gym.gymNameThai}
        </h3>
        {gym.gymNameEnglish && (
          <p className="mb-3 text-zinc-400 text-sm">{gym.gymNameEnglish}</p>
        )}

        {/* Location */}
        <div className="flex items-start gap-2 mb-4 text-zinc-300">
          <MapPinIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-red-500" />
          <span className="text-sm line-clamp-2">{gym.address}</span>
        </div>

        {/* Details */}
        {gym.details && (
          <p className="mb-4 text-zinc-400 text-sm line-clamp-3">
            {gym.details}
          </p>
        )}

        {/* Price and CTA */}
        <div className="flex justify-between items-center pt-4 border-zinc-700 border-t">
          <div>
            {minPrice ? (
              <div>
                <p className="text-zinc-400 text-xs">เริ่มต้น</p>
                <p className="font-bold text-red-500 text-lg">
                  ฿{minPrice.toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">ติดต่อสอบถาม</p>
            )}
          </div>
          <Link
            href={`/gyms/${gym.slug}`}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white text-sm transition-colors"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  );
}

