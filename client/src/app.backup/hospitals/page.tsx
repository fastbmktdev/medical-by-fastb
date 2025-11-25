"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
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

  // Filter hospitals based on search (using debounced query)
  const filteredHospitals = hospitals.filter((hospital) => {
    const query = debouncedSearchQuery.toLowerCase();
    return (
      hospital.hospital_name.toLowerCase().includes(query) ||
      hospital.hospital_name_english?.toLowerCase().includes(query) ||
      hospital.address?.toLowerCase().includes(query)
    );
  });

  // Track search event when debounced search query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() && debouncedSearchQuery.trim() !== prevSearchQuery.current) {
      try {
        trackSearch(debouncedSearchQuery.trim(), "hospitals", filteredHospitals.length);
        prevSearchQuery.current = debouncedSearchQuery.trim();
      } catch (error) {
        console.warn('Analytics tracking error:', error);
      }
    }
  }, [debouncedSearchQuery, filteredHospitals.length]);

  return (
    <div className="bg-white min-h-screen">
      <PageHeader 
        title="โรงพยาบาลไทย" 
        description="ค้นหาและจองโรงพยาบาลไทยที่เหมาะกับคุณ จากค่ายชั้นนำทั่วประเทศไทย"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <MagnifyingGlassIcon className="top-1/2 left-4 absolute w-6 h-6 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาโรงพยาบาล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white py-4 pr-12 pl-14 border-2 border-gray-200  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary w-full placeholder-gray-400 text-gray-900 text-lg shadow-sm hover:shadow-md transition-all duration-200"
              />
              {isDebouncing && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent  animate-spin" />
                </div>
              )}
              {!isDebouncing && searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="ล้างการค้นหา"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
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
                    onClick={() => setSearchQuery("")}
                    className="bg-brand-primary hover:bg-purple-600 mt-4 px-6 py-2  transition-colors text-white font-medium"
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
