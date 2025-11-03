"use client";

import { useEffect, useState } from "react";

export default function AssetLoader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = 2;
    const fadeOut = () => {
      loaded++;
      if (loaded >= total) {
        setTimeout(() => setIsFading(true), 500);
        setTimeout(() => setIsLoading(false), 1300);
      }
    };

    const video = document.createElement("video");
    video.src = "/assets/videos/hero-background.mp4";
    video.preload = "auto";
    video.oncanplaythrough = fadeOut;
    video.onerror = fadeOut;
    video.load();

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
      video.oncanplaythrough = null;
      video.onerror = null;
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  if (!isLoading) return <>{children}</>;

  return (
    <>
      <div
        className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-[800ms] ${
          isFading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="flex justify-center items-center h-full">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <div className={isFading ? "opacity-100 transition-opacity duration-500" : "opacity-0"}>
        {children}
      </div>
    </>
  );
}
