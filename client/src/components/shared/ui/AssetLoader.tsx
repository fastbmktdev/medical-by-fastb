"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";

export default function AssetLoader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = 3; // 2 videos + 1 image
    const fadeOut = () => {
      loaded++;
      if (loaded >= total) {
        setTimeout(() => setIsFading(true), 500);
        setTimeout(() => setIsLoading(false), 1300);
      }
    };

    // Load hero background videos (same as HeroSection uses)
    const video1 = document.createElement("video");
    video1.src = "/assets/videos/hero-background-1.mp4";
    video1.preload = "auto";
    video1.oncanplaythrough = fadeOut;
    video1.onerror = fadeOut;
    video1.load();

    const video2 = document.createElement("video");
    video2.src = "/assets/videos/hero-background-2.mp4";
    video2.preload = "auto";
    video2.oncanplaythrough = fadeOut;
    video2.onerror = fadeOut;
    video2.load();

    const img = new Image();
    img.src = "/assets/images/bg-main.jpg";
    img.onload = fadeOut;
    img.onerror = fadeOut;

    const timeout = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => setIsLoading(false), 800);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      video1.oncanplaythrough = null;
      video1.onerror = null;
      video2.oncanplaythrough = null;
      video2.onerror = null;
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  if (!isLoading) return <>{children}</>;

  return (
    <>
      <div
        className={`fixed inset-0 z-9999 bg-white transition-opacity duration-800 ${
          isFading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner 
            size="xl" 
            className="border-purple-500 text-purple-500"
          />
        </div>
      </div>
      <div className={isFading ? "opacity-100 transition-opacity duration-800" : "opacity-0"}>
        {children}
      </div>
    </>
  );
}
