"use client";

import { memo } from "react";

interface GymMapProps {
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  gymName?: string;
}

export const GymMap = memo(function GymMap({ latitude, longitude, mapUrl, gymName }: GymMapProps) {
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  if (!hasCoords && !mapUrl) {
    return (
      <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
        <h2 className="mb-4 font-bold text-2xl">แผนที่</h2>
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500 text-sm">ยังไม่มีข้อมูลตำแหน่ง</p>
        </div>
      </div>
    );
  }

  // Use Google Maps embed with pinned coordinates if available (no API key required)
  const embedSrc = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null;

  return (
    <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
      <h2 className="mb-4 font-bold text-2xl">แผนที่</h2>
      {embedSrc ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <iframe
            title={gymName ? `แผนที่ ${gymName}` : "แผนที่ค่ายมวย"}
            src={embedSrc}
            className="w-full h-[320px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg transition-colors"
          >
            เปิดใน Google Maps
          </a>
        )
      )}
    </div>
  );
});


