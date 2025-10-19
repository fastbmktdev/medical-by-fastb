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
    <div className="bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-white text-4xl">
              ตั๋วชกมวย & อีเวนต์
            </h1>
            <p className="mx-auto max-w-3xl text-zinc-300 text-xl">
              จองตั๋วชมการแข่งขันมวยชั้นนำทั่วประเทศไทย
            </p>
          </div>
        </div>
      </div>

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
                className="bg-zinc-800 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-400"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-zinc-800 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white appearance-none cursor-pointer"
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
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
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
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
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

function EventCard({
  event,
  viewMode,
}: {
  event: Event;
  viewMode: ViewMode;
}) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (viewMode === "list") {
    return (
      <div className="group bg-zinc-800 hover:shadow-lg hover:shadow-red-500/20 p-6 border border-zinc-700 hover:border-red-500 rounded-lg transition-all">
        <div className="flex sm:flex-row flex-col justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="mb-2 font-bold text-white group-hover:text-red-400 text-xl transition-colors">
              {event.name}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <MapPinIcon className="flex-shrink-0 w-4 h-4 text-red-500" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <CalendarIcon className="flex-shrink-0 w-4 h-4 text-blue-500" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <ClockIcon className="flex-shrink-0 w-4 h-4 text-green-500" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href={`/events/${event.slug}`}
              className="sm:flex-initial flex-1 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-semibold text-white text-sm text-center transition-colors"
            >
              ดูรายละเอียด
            </Link>
            <Link
              href={`/events/${event.slug}`}
              className="sm:flex-initial flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white text-sm text-center transition-colors"
            >
              จองตั๋ว
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group bg-zinc-800 hover:shadow-2xl hover:shadow-red-500/30 border border-zinc-700 hover:border-red-500 rounded-lg overflow-hidden transition-all duration-300">
      {/* Image Placeholder */}
      <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-900 h-48">
        <div className="text-zinc-600 text-6xl">🥊</div>
        {event.price && (
          <div className="top-2 right-2 absolute flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
            <TicketIcon className="w-4 h-4 text-green-400" />
            <span className="font-bold text-white text-sm">
              ฿{event.price.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="mb-3 font-bold text-white group-hover:text-red-400 text-xl transition-colors">
          {event.name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-zinc-300 text-sm">
            <MapPinIcon className="flex-shrink-0 mt-0.5 w-4 h-4 text-red-500" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <CalendarIcon className="flex-shrink-0 w-4 h-4 text-blue-500" />
            <span className="line-clamp-1">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <ClockIcon className="flex-shrink-0 w-4 h-4 text-green-500" />
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/events/${event.slug}`}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg font-semibold text-white text-sm text-center transition-colors"
          >
            ดูรายละเอียด
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold text-white text-sm text-center transition-colors"
          >
            จองตั๋ว
          </Link>
        </div>
      </div>
    </div>
  );
}

