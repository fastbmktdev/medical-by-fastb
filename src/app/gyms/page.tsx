"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/database/supabase/client";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@heroui/react";

interface Gym {
  id: string;
  slug: string;
  gym_name: string;
  gym_name_english: string | null;
  address: string | null;
  gym_details: string | null;
  gym_type: string | null;
}

export default function GymsPage() {
  const supabase = createClient();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch approved gyms from database
  useEffect(() => {
    async function loadGyms() {
      try {
        const { data, error } = await supabase
          .from("gyms")
          .select(
            "id, slug, gym_name, gym_name_english, address, gym_details, gym_type"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading gyms:", error);
        } else {
          setGyms(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGyms();
  }, [supabase]);

  // Filter gyms based on search and type
  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch =
      gym.gym_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.gym_name_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || gym.gym_type === selectedType;

    return matchesSearch && matchesType;
  });

  const gymTypes = [
    "all",
    ...new Set(
      gyms
        .map((gym) => gym.gym_type)
        .filter((type): type is string => Boolean(type))
    ),
  ];

  return (
    <div className="bg-zinc-950 mt-16 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-950 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
          <div className="py-4 text-center">
            <h1 className="mb-4 font-bold text-white text-4xl">ค่ายมวยไทย</h1>
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
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-400"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white appearance-none cursor-pointer"
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 text-zinc-400">
              พบ {filteredGyms.length} ค่ายมวย
            </div>

            {/* Gyms Grid */}
            {filteredGyms.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-zinc-400 text-xl">
                  {gyms.length === 0
                    ? "ยังไม่มีค่ายมวย"
                    : "ไม่พบค่ายมวยที่ตรงกับการค้นหา"}
                </p>
                {gyms.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("all");
                    }}
                    className="bg-red-600 hover:bg-red-700 mt-4 px-6 py-2 rounded-lg text-white transition-colors"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            ) : (
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredGyms.map((gym) => (
                  <GymCard key={gym.id} gym={gym} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GymCard({ gym }: { gym: Gym }) {
  return (
    <div className="group bg-zinc-950 hover:shadow-2xl hover:shadow-red-500/30 border border-zinc-700 hover:border-red-500 rounded-lg overflow-hidden transition-all duration-300">
      {/* Image Placeholder */}
      <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-950 h-48">
        <div className="text-zinc-600 text-6xl">🥊</div>
      </div>

      <div className="p-6">
        {/* Gym Name */}
        <h3 className="mb-2 font-bold text-white group-hover:text-red-400 text-xl transition-colors">
          {gym.gym_name}
        </h3>
        {gym.gym_name_english && (
          <p className="mb-3 text-zinc-400 text-sm">{gym.gym_name_english}</p>
        )}

        {/* Location */}
        {gym.address && (
          <div className="flex items-start gap-2 mb-4 text-zinc-300">
            <MapPinIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-red-500" />
            <span className="text-sm line-clamp-2">{gym.address}</span>
          </div>
        )}

        {/* Details */}
        {gym.gym_details && (
          <p className="mb-4 text-zinc-400 text-sm line-clamp-3">
            {gym.gym_details}
          </p>
        )}

        {/* CTA */}
        <div className="flex justify-between items-center pt-4 border-zinc-700 border-t">
          <div>
            {gym.gym_type && (
              <p className="text-zinc-400 text-xs">{gym.gym_type}</p>
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
