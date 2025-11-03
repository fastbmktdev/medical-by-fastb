"use client";

import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { Event } from "@/types";
import { BaseCard } from "./BaseCard";

type ViewMode = "list" | "grid";

interface EventCardProps {
  event: Event;
  viewMode: ViewMode;
}

export function EventCard({ event, viewMode }: EventCardProps) {
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

  const imageUrl = event.image || "/assets/images/fallback-img.jpg";

  if (viewMode === "list") {
    return (
      <BaseCard className="p-6">
        <div className="flex sm:flex-row flex-col justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="mb-2 font-bold group-hover:text-red-400 text-xl transition-colors">
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
              className="sm:flex-initial flex-1 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-semibold text-sm text-center transition-colors"
            >
              ดูรายละเอียด
            </Link>
            <Link
              href={`/events/${event.slug}`}
              className="sm:flex-initial flex-1 bg-brand-primary hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-sm text-center transition-colors"
            >
              จองตั๋ว
            </Link>
          </div>
        </div>
      </BaseCard>
    );
  }

  // Grid view
  return (
    <BaseCard>
      <div className="relative w-full h-48">
        <Image
          src={imageUrl}
          alt={event.name || "Event image"}
          fill
          className="object-cover"
        />
        {event.price && (
          <div className="top-2 right-2 absolute flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
            <TicketIcon className="w-4 h-4 text-green-400" />
            <span className="font-bold text-sm">
              ฿{event.price.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="mb-3 font-bold group-hover:text-red-400 text-xl transition-colors">
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
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg font-semibold text-sm text-center transition-colors"
          >
            ดูรายละเอียด
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="flex-1 bg-brand-primary hover:bg-red-700 py-2 rounded-lg font-semibold text-sm text-center transition-colors"
          >
            จองตั๋ว
          </Link>
        </div>
      </div>
    </BaseCard>
  );
}
