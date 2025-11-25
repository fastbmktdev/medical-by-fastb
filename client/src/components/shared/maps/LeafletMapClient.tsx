"use client";

import { memo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom red marker icon for dark red theme
const createRedMarker = () => {
  return L.divIcon({
    className: "custom-red-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

interface LeafletMapClientProps {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
  height?: string;
  className?: string;
}

/**
 * LeafletMapClient component - Client-side only map component
 * This is separated to avoid SSR issues with Leaflet
 */
export default memo(function LeafletMapClient({
  latitude,
  longitude,
  address,
  title,
  height = "400px",
  className = "",
}: LeafletMapClientProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Inject custom dark red theme styles
  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleId = "leaflet-dark-red-theme";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .custom-red-marker {
        background: transparent !important;
        border: none !important;
      }
      
      /* Dark red theme styling for Leaflet controls */
      .leaflet-container {
        background: #09090b !important;
        color: #f4f4f5 !important;
      }
      
      .leaflet-control-zoom a {
        background-color: #18181b !important;
        color: #f4f4f5 !important;
        border: 1px solid #3f3f46 !important;
      }
      
      .leaflet-control-zoom a:hover {
        background-color: #dc2626 !important;
        color: white !important;
        border-color: #dc2626 !important;
      }
      
      .leaflet-popup-content-wrapper {
        background: #18181b !important;
        color: #f4f4f5 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      }
      
      .leaflet-popup-tip {
        background: #18181b !important;
      }
      
      .leaflet-popup-close-button {
        color: #f4f4f5 !important;
      }
      
      .leaflet-popup-close-button:hover {
        color: #dc2626 !important;
      }
      
      .leaflet-control-attribution {
        background: rgba(24, 24, 27, 0.8) !important;
        color: #a1a1aa !important;
        font-size: 10px !important;
      }
      
      .leaflet-control-attribution a {
        color: #dc2626 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || typeof window === "undefined") return;

    // Initialize map with dark theme
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    // Custom dark red tile layer using CartoDB Dark Matter
    // This is a free tile provider with dark theme
    const darkRedTiles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    );

    // Using CartoDB Dark Matter as base (free, no API key needed)
    darkRedTiles.addTo(map);

    // Add custom red marker
    const redIcon = createRedMarker();
    const marker = L.marker([latitude, longitude], { icon: redIcon }).addTo(map);

    // Add popup if address or title is provided
    if (address || title) {
      const popupContent = `
        <div style="color: #f4f4f5; padding: 4px;">
          ${title ? `<strong style="color: #dc2626; font-size: 14px;">${title}</strong><br/>` : ""}
          ${address ? `<span style="color: #a1a1aa; font-size: 12px;">${address}</span>` : ""}
        </div>
      `;
      marker.bindPopup(popupContent);
    }

    mapRef.current = map;
    markerRef.current = marker;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, address, title]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div
        ref={mapContainerRef}
        className="w-full h-full  overflow-hidden border border-zinc-800"
        style={{ height }}
      />
    </div>
  );
});

