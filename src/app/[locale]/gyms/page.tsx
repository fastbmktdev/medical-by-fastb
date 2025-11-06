"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/database/supabase/client";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { Link } from '@/navigation';
import { Button } from "@heroui/react";
import { PageHeader } from "@/components/shared";
import { GymCard } from "@/components/shared";
import type { Gym } from "@/types/app.types";
import { trackSearch } from "@/lib/utils/analytics";

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

  const prevSearchQuery = useRef<string>("");

  // Filter gyms based on search and type
  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch =
      gym.gym_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.gym_name_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || gym.gym_type === selectedType;

    return matchesSearch && matchesType;
  });

  // Track search event when search query changes
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.trim() !== prevSearchQuery.current) {
      try {
        trackSearch(searchQuery.trim(), selectedType !== "all" ? selectedType : "gyms", filteredGyms.length);
        prevSearchQuery.current = searchQuery.trim();
      } catch (error) {
        console.warn('Analytics tracking error:', error);
      }
    }
  }, [searchQuery, selectedType, filteredGyms.length]);

  const gymTypes = [
    "all",
    ...new Set(
      gyms
        .map((gym) => gym.gym_type)
        .filter((type): type is string => Boolean(type))
    ),
  ];

  return (
    <div className="bg-zinc-950 min-h-screen">
      <PageHeader 
        title="ค่ายมวยไทย" 
        description="ค้นหาและจองค่ายมวยไทยที่เหมาะกับคุณ จากค่ายชั้นนำทั่วประเทศไทย"
      />

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
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full placeholder-zinc-400"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full appearance-none cursor-pointer"
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
                    className="bg-brand-primary hover:bg-red-700 mt-4 px-6 py-2 rounded-lg transition-colors"
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
