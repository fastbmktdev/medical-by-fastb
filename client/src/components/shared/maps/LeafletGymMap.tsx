"use client";

import { memo } from "react";
import { LeafletMap } from "./LeafletMap";
import { Link } from '@/navigation';

interface LeafletHospitalMapProps {
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  hospitalName?: string;
  useLeaflet?: boolean;
}

/**
 * HospitalMap component with option to use Leaflet or Google Maps embed
 * Leaflet provides free, customizable dark red theme
 */
export const LeafletHospitalMap = memo(function LeafletHospitalMap({
  latitude,
  longitude,
  mapUrl,
  hospitalName,
  useLeaflet = true,
}: LeafletHospitalMapProps) {
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  if (!hasCoords && !mapUrl) {
    return (
      <div className="bg-zinc-100 p-6 border border-zinc-700 ">
        <h2 className="mb-4 font-bold text-2xl">แผนที่</h2>
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500 text-sm">ยังไม่มีข้อมูลตำแหน่ง</p>
        </div>
      </div>
    );
  }

  // Google Maps embed (fallback)
  const embedSrc = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null;

  return (
    <div className="bg-zinc-100 p-6 border border-zinc-700 ">
      <h2 className="mb-4 font-bold text-2xl">แผนที่</h2>
      {hasCoords && useLeaflet ? (
        <LeafletMap
          latitude={latitude}
          longitude={longitude}
          title={hospitalName || "โรงพยาบาล"}
          height="320px"
        />
      ) : embedSrc ? (
        <div className="overflow-hidden  border border-zinc-800">
          <iframe
            title={hospitalName ? `แผนที่ ${hospitalName}` : "แผนที่โรงพยาบาล"}
            src={embedSrc}
            className="w-full h-[320px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        mapUrl && (
          <Link
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-zinc-600 px-4 py-2  transition-colors"
          >
            เปิดใน Google Maps
          </Link>
        )
      )}
    </div>
  );
});

