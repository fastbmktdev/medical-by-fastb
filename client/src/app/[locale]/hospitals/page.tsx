"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
import {
  // MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
// import { Link } from '@/navigation';
// import { Button } from "@heroui/react";
import { PageHeader } from "@/components/shared";
import { HospitalCard } from "@/components/shared";
import { Loading } from "@/components/design-system/primitives/Loading";
import type { hospital } from '@shared/types/app.types';
import { trackSearch } from '@shared/lib/utils/analytics';
import { useDebouncedValue } from '@shared/lib/hooks';

export default function HospitalsPage() {
  const supabase = createClient();
  const [hospitals, setHospitals] = useState<hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  // Debounce search query with loading state
  const { debouncedValue: debouncedSearchQuery, isDebouncing } = useDebouncedValue(searchQuery, 300);

  // Fetch approved hospitals from database
  useEffect(() => {
    async function loadHospitals() {
      try {
        const { data, error } = await supabase
          .from("hospitals")
          .select(
            "id, slug, hospital_name, hospital_name_english, address, hospital_details, hospital_type"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading hospitals:", error);
        } else {
          setHospitals(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHospitals();
  }, [supabase]);

  const prevSearchQuery = useRef<string>("");

  // Filter hospitals based on search and type (using debounced query)
  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch =
      hospital.hospital_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      hospital.hospital_name_english?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      hospital.address?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    const matchesType = selectedType === "all" || hospital.hospital_type === selectedType;

    return matchesSearch && matchesType;
  });

  // Track search event when debounced search query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() && debouncedSearchQuery.trim() !== prevSearchQuery.current) {
      try {
        trackSearch(debouncedSearchQuery.trim(), selectedType !== "all" ? selectedType : "hospitals", filteredHospitals.length);
        prevSearchQuery.current = debouncedSearchQuery.trim();
      } catch (error) {
        console.warn('Analytics tracking error:', error);
      }
    }
  }, [debouncedSearchQuery, selectedType, filteredHospitals.length]);

  const hospitalTypes = [
    "all",
    ...new Set(
      hospitals
        .map((hospital) => hospital.hospital_type)
        .filter((type): type is string => Boolean(type))
    ),
  ];

  return (
    <div className="bg-white min-h-screen">
      <PageHeader 
        title="โรงพยาบาลไทย" 
        description="ค้นหาและจองโรงพยาบาลไทยที่เหมาะกับคุณ จากค่ายชั้นนำทั่วประเทศไทย"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-gray-400 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="ค้นหาโรงพยาบาล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white py-3 pr-4 pl-10 border border-gray-300  focus:outline-none focus:ring-2 w-full placeholder-gray-400 text-zinc-950"
              />
              {isDebouncing && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent  animate-spin" />
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-gray-400 -translate-y-1/2 transform" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-white py-3 pr-4 pl-10 border border-gray-300  focus:outline-none focus:ring-2 w-full appearance-none cursor-pointer text-zinc-950"
              >
                <option value="all">ทุกประเภท</option>
                {hospitalTypes
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
            <Loading centered size="xl" />
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 text-gray-600">
              พบ {filteredHospitals.length} โรงพยาบาล
            </div>

            {/* hospitals Grid */}
            {filteredHospitals.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-600 text-xl">
                  {hospitals.length === 0
                    ? "ยังไม่มีโรงพยาบาล"
                    : "ไม่พบโรงพยาบาลที่ตรงกับการค้นหา"}
                </p>
                {hospitals.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("all");
                    }}
                    className="bg-brand-primary hover:bg-[#8B5CF6] mt-4 px-6 py-2  transition-colors"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            ) : (
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredHospitals.map((hospital) => (
                  <HospitalCard key={hospital.id} hospital={hospital} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
