"use client";

import { memo, useMemo } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Link } from '@/navigation';
import type { hospital as AppHospital } from '@shared/types/app.types';
import type { hospital as DatabaseHospital } from '@shared/types/database.types';
import { BaseCard } from "./BaseCard";
import { CardImage } from "./CardImage";
import { extractImageUrl } from "./utils/imageUtils";
import { useSanitizedHTML } from "@/hooks/useSanitizedHTML";

interface HospitalCardProps {
  hospital: AppHospital | DatabaseHospital;
}

function HospitalCardComponent({ hospital }: HospitalCardProps) {
  // Memoize image URL extraction
  const imageUrl = useMemo(
    () => extractImageUrl({ images: hospital.images }),
    [hospital.images ?? []]
  );

  // Memoize hospital name for alt text
  const imageAlt = useMemo(
    () => hospital.hospital_name || "hospital image",
    [hospital.hospital_name]
  );

  // Memoize hospital slug for link
  const hospitalLink = useMemo(
    () => `/hospitals/${hospital.slug}`,
    [hospital.slug]
  );

  // Use custom hook for sanitized HTML
  const sanitizedDetails = useSanitizedHTML(hospital.hospital_details, {
    replaceNewlines: true,
  });

  return (
    <BaseCard className="bg-white border border-gray-200 shadow-sm hover:shadow-md">
      <CardImage
        src={imageUrl}
        alt={imageAlt}
        aspectRatio="h-48"
      />

      <div className="p-6">
        {/* Hospital Name */}
        <h3 className="mb-2 font-semibold group-hover:text-purple-600 text-xl text-gray-900 transition-colors">
          {hospital.hospital_name}
        </h3>
        {hospital.hospital_name_english && (
          <p className="mb-3 text-gray-600 text-sm">{hospital.hospital_name_english}</p>
        )}

        {/* Location */}
        {hospital.address && (
          <div className="flex items-start gap-2 mb-4 text-gray-700">
            <MapPinIcon className="shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
            <span className="text-sm line-clamp-2">{hospital.address}</span>
          </div>
        )}

        {/* Details */}
        {sanitizedDetails && (
          <div 
            className="mb-4 text-gray-600 text-sm line-clamp-3"
            dangerouslySetInnerHTML={{ __html: sanitizedDetails }}
          />
        )}

        {/* CTA */}
        <div className="flex justify-between items-center pt-4 border-gray-200 border-t">
          <div>
            {hospital.hospital_type && (
              <p className="text-gray-500 text-xs">{hospital.hospital_type}</p>
            )}
          </div>
          <Link
            href={hospitalLink}
            className="bg-brand-primary hover:bg-[#8B5CF6] text-white px-4 py-2  font-semibold text-sm transition-colors"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </BaseCard>
  );
}

export const HospitalCard = memo(HospitalCardComponent);
