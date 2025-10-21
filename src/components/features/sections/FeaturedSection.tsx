"use client";

import { useState } from "react";
import Link from "next/link";
import { Gym, Event } from "@/types";
import { MapPinIcon, CalendarIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";

interface FeaturedSectionProps {
  gyms: Gym[];
  events: Event[];
}

export default function FeaturedSection({
  gyms,
  events,
}: FeaturedSectionProps) {
  const [activeTab, setActiveTab] = useState<"gyms" | "events">("gyms");

  return (
    <section className="bg-zinc-950 py-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-white text-3xl md:text-4xl">
            Find Your Next Fight
          </h2>
          <p className="text-zinc-400 text-lg">
            Discover top-rated Muay Thai gyms and exciting upcoming events.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab("gyms")}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "gyms"
                ? "bg-red-600 text-white"
                : "bg-zinc-950 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Recommended Camps
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "events"
                ? "bg-red-600 text-white"
                : "bg-zinc-950 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Upcoming Events
          </button>
        </div>

        {/* Content */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {activeTab === "gyms"
            ? gyms.slice(0, 3).map((gym) => <GymCard key={gym.id} gym={gym} />)
            : events
                .slice(0, 3)
                .map((event) => <EventCard key={event.id} event={event} />)}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href={activeTab === "gyms" ? "/gyms" : "/events"}
            className="inline-block bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold text-white transition-colors"
          >
            {activeTab === "gyms" ? "View All Camps" : "View All Events"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function GymCard({ gym }: { gym: Gym }) {
  return (
    <Link href={`/gyms/${gym.slug}`}>
      <div className="group bg-zinc-950 hover:shadow-2xl hover:shadow-red-500/20 rounded-lg overflow-hidden transition-all">
        {/* Image */}
        <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-950 h-48">
          <div className="text-zinc-600 text-6xl">🥊</div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 font-bold text-white group-hover:text-red-400 text-lg transition-colors">
            {gym.gym_name}
          </h3>
          {gym.gym_name_english && (
            <p className="mb-3 text-zinc-400 text-sm">{gym.gym_name_english}</p>
          )}
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate">{gym.address?.split(",")[0] || "Location not available"}</span>
          </div>
          <p className="mt-2 text-zinc-500 text-sm">
            {gym.packages && gym.packages.length > 0
              ? `Starts from ฿${Math.min(...gym.packages.map((p) => p.base_price)).toLocaleString()}`
              : "No pricing info"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("th-TH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/events/${event.slug}`}>
      <div className="group bg-zinc-950 hover:shadow-2xl hover:shadow-red-500/20 rounded-lg overflow-hidden transition-all">
        {/* Image */}
        <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-950 h-48">
          <span className="text-6xl">🥊</span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 font-bold text-white group-hover:text-red-400 text-lg transition-colors">
            {event.name}
          </h3>
          <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm">
            <CalendarIcon className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

