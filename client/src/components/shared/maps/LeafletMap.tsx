"use client";

import { memo } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const LeafletMapClient = dynamic(() => import("./LeafletMapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100  border border-zinc-800">
      <div className="text-zinc-500 text-sm">กำลังโหลดแผนที่...</div>
    </div>
  ),
});

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
  height?: string;
  className?: string;
}

/**
 * LeafletMap component - Customizable dark red themed map using Leaflet
 * Free and open-source, no API key required
 * Uses dynamic import to avoid SSR issues
 */
export const LeafletMap = memo(function LeafletMap({
  latitude,
  longitude,
  address,
  title,
  height = "400px",
  className = "",
}: LeafletMapProps) {
  return (
    <LeafletMapClient
      latitude={latitude}
      longitude={longitude}
      address={address}
      title={title}
      height={height}
      className={className}
    />
  );
});

