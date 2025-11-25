"use client";

import { memo } from "react";
import { LeafletMap } from "./LeafletMap";

interface ContactMapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * ContactMap component - Displays map for contact page using Leaflet
 * Free and open-source, no API key required
 * Customizable dark red theme matching the site design
 */
export const ContactMap = memo(function ContactMap({ 
  address, 
  latitude, 
  longitude,
}: ContactMapProps) {
  // Default office location: 123 Sukhumvit Road, Khlong Toei, Watthana, Bangkok 10110
  const defaultLat = 13.7300;
  const defaultLon = 100.5680;
  const defaultAddress = "123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ 10110";

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const finalLat = hasCoords ? latitude : defaultLat;
  const finalLon = hasCoords ? longitude : defaultLon;
  const finalAddress = address || defaultAddress;

  return (
    <div className="bg-zinc-100 p-8  border border-zinc-800">
      <h2 className="mb-6 font-bold text-2xl text-center">แผนที่สำนักงาน</h2>
      <div className="mb-4 text-center">
        <p className="text-zinc-300">{finalAddress}</p>
      </div>
      
      <LeafletMap
        latitude={finalLat}
        longitude={finalLon}
        address={finalAddress}
        title="สำนักงาน"
        height="500px"
      />
    </div>
  );
});

