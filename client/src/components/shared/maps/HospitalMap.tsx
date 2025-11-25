"use client";

import { memo } from "react";
import { LeafletHospitalMap } from "./LeafletGymMap";

interface HospitalMapProps {
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  hospitalName?: string;
  useLeaflet?: boolean;
}

/**
 * HospitalMap component - Displays map for hospital detail page
 * Supports both Leaflet (free, customizable dark red theme) and Google Maps embed
 */
export const HospitalMap = memo(function HospitalMap({ 
  latitude, 
  longitude, 
  mapUrl, 
  hospitalName,
  useLeaflet = true,
}: HospitalMapProps) {
  // Use LeafletHospitalMap which supports both Leaflet and Google Maps
  return (
    <LeafletHospitalMap
      latitude={latitude}
      longitude={longitude}
      mapUrl={mapUrl}
      hospitalName={hospitalName}
      useLeaflet={useLeaflet}
    />
  );
});


