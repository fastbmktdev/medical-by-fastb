"use client";

import { MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { Gym } from "@/types";
import { BaseCard } from "./BaseCard";

interface GymCardProps {
  gym: Gym;
}

export function GymCard({ gym }: GymCardProps) {
  const imageUrl = gym.images?.[0] || "/assets/images/fallback-img.jpg";

  return (
    <BaseCard>
      <div className="relative w-full h-48">
        <Image
          src={imageUrl}
          alt={gym.gym_name || "Gym image"}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-6">
        {/* Gym Name */}
        <h3 className="mb-2 font-bold group-hover:text-red-400 text-xl transition-colors">
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
          <div 
            className="mb-4 text-zinc-400 text-sm line-clamp-3"
            dangerouslySetInnerHTML={{ 
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              __html: require('@/lib/utils/sanitize').sanitizeHTML(
                gym.gym_details.replace(/\n/g, '<br />')
              ) 
            }}
          />
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
            className="bg-brand-primary hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </BaseCard>
  );
}
