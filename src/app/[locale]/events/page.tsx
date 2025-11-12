"use client";

import { useState, useEffect, useRef } from "react";
import { Event } from "@/types";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared";
import { EventCard } from "@/components/shared";
import { trackSearch } from "@/lib/utils/analytics";

type ViewMode = "list" | "grid";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/events?published=true&limit=100');
        const data = await response.json();

        if (data.success) {
          setEvents(data.data || []);
        } else {
          setError(data.error || 'Failed to load events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Extract unique cities from events
  const cities = [
    "all",
    ...new Set(
      events.map((event) => {
        // Extract city from location
        const parts = event.location.split(",");
        return parts[parts.length - 1]?.trim() || event.location;
      })
    ),
  ];

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.name_english?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const eventCity = event.location.split(",").pop()?.trim() || event.location;
    const matchesCity =
      selectedCity === "all" || eventCity.includes(selectedCity);

    return matchesSearch && matchesCity;
  });

  // Sort by date
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => {
      const dateA = new Date(a.event_date || a.date || '').getTime();
      const dateB = new Date(b.event_date || b.date || '').getTime();
      return dateA - dateB;
    }
  );

  const prevSearchQuery = useRef<string>("");

  // Track search event when search query changes
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.trim() !== prevSearchQuery.current) {
      try {
        trackSearch(searchQuery.trim(), selectedCity !== "all" ? selectedCity : "events", filteredEvents.length);
        prevSearchQuery.current = searchQuery.trim();
      } catch (error) {
        console.warn('Analytics tracking error:', error);
      }
    }
  }, [searchQuery, selectedCity, filteredEvents.length]);

  return (
    <div className="bg-zinc-950 min-h-screen">
      <PageHeader 
        title="อีเวนต์" 
        description="จองตั๋วชมการแข่งขันมวยชั้นนำทั่วประเทศไทย"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="ค้นหาอีเวนต์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full placeholder-zinc-400"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full appearance-none cursor-pointer"
              >
                <option value="all">จังหวัด/เมืองทั้งหมด</option>
                {cities
                  .filter((city) => city !== "all")
                  .map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-zinc-400">
              พบอีเวนต์ {sortedEvents.length} รายการ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-brand-primary text-white"
                    : "bg-zinc-950 text-zinc-400 hover:text-white"
                }`}
                aria-label="List view"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-brand-primary text-white"
                    : "bg-zinc-950 text-zinc-400 hover:text-white"
                }`}
                aria-label="Grid view"
              >
                <ViewColumnsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 text-xl">กำลังโหลดอีเวนต์...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-red-400 text-xl">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-primary hover:bg-red-600 mt-4 px-6 py-2 rounded-lg transition-colors"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 text-xl">
              ไม่พบอีเวนต์ที่ตรงกับการค้นหา
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("all");
              }}
              className="bg-brand-primary hover:bg-red-600 mt-4 px-6 py-2 rounded-lg transition-colors"
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

