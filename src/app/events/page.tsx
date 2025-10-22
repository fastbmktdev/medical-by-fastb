"use client";

import { useState } from "react";
import { EVENTS } from "@/lib/data";
import { Event } from "@/types";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  TicketIcon,
  ViewColumnsIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EventCard } from "@/components/ui/cards/EventCard";

type ViewMode = "list" | "grid";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Extract unique cities from events
  const cities = [
    "all",
    ...new Set(
      EVENTS.map((event) => {
        // Extract city from location
        const parts = event.location.split(",");
        return parts[parts.length - 1]?.trim() || event.location;
      })
    ),
  ];

  // Filter events
  const filteredEvents = EVENTS.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const eventCity = event.location.split(",").pop()?.trim() || event.location;
    const matchesCity =
      selectedCity === "all" || eventCity.includes(selectedCity);

    return matchesSearch && matchesCity;
  });

  // Sort by date
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-400"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white appearance-none cursor-pointer"
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
                    ? "bg-red-600 text-white"
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
                    ? "bg-red-600 text-white"
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
        {sortedEvents.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 text-xl">
              ไม่พบอีเวนต์ที่ตรงกับการค้นหา
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("all");
              }}
              className="bg-red-600 hover:bg-red-700 mt-4 px-6 py-2 rounded-lg text-white transition-colors"
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

