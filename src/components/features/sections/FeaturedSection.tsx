"use client";

import { useState } from "react";
import Link from "next/link";
import { Gym, Event } from "@/types";
import { GymCard, EventCard } from "@/components/ui/cards";

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
    <section className="py-16">
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
        <div className="flex justify-center gap-4 mb-12" role="tablist" aria-label="Featured content tabs">
          <button
            onClick={() => setActiveTab("gyms")}
            role="tab"
            aria-selected={activeTab === "gyms"}
            aria-controls="featured-content"
            className={`px-8 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              activeTab === "gyms"
                ? "bg-red-600 text-white"
                : "bg-zinc-950 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Recommended Camps
          </button>
          <button
            onClick={() => setActiveTab("events")}
            role="tab"
            aria-selected={activeTab === "events"}
            aria-controls="featured-content"
            className={`px-8 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              activeTab === "events"
                ? "bg-red-600 text-white"
                : "bg-zinc-950 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Upcoming Events
          </button>
        </div>

        {/* Content */}
        <div 
          id="featured-content"
          role="tabpanel"
          aria-label={activeTab === "gyms" ? "Recommended Camps" : "Upcoming Events"}
          className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {activeTab === "gyms"
            ? gyms.slice(0, 3).map((gym) => (
                <GymCard key={gym.id} gym={gym} />
              ))
            : events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} viewMode="grid" />
              ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href={activeTab === "gyms" ? "/gyms" : "/events"}
            className="inline-block bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 font-semibold text-white transition-colors"
            aria-label={activeTab === "gyms" ? "View all Muay Thai camps" : "View all upcoming events"}
          >
            {activeTab === "gyms" ? "View All Camps" : "View All Events"}
          </Link>
        </div>
      </div>
    </section>
  );
}
