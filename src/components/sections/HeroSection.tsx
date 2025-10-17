"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="relative flex justify-center items-center h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/videos/hero-background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="z-10 relative mx-auto px-4 max-w-6xl text-center">
        <p className="mb-4 font-semibold text-red-500 text-sm md:text-base tracking-wider">
          WELCOME TO MUAYTHAI NEXT
        </p>
        <h1 className="mb-6 font-bold text-white text-4xl md:text-6xl lg:text-7xl leading-tight">
          EVERY GREAT FIGHT STARTS<br />WITH A GREAT PREPARATION
        </h1>
        <p className="mb-4 text-zinc-300 text-xl md:text-2xl">
          JOURNEY STARTS WITH ONE STEP!
        </p>
        <p className="mx-auto mb-12 max-w-3xl text-zinc-400 text-base md:text-lg">
          JOIN OUR COMMUNITY AND BE PART OF THE NEXT GENERATION OF MUAYTHAI
          FIGHTERS
        </p>

        {/* CTA Buttons */}
        <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
          <Link
            href="/gyms"
            className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg w-full sm:w-auto font-semibold text-white transition-colors"
          >
            Book Muay Thai Gyms
          </Link>
          <Link
            href="/events"
            className="bg-white hover:bg-zinc-100 px-8 py-4 rounded-lg w-full sm:w-auto font-semibold text-zinc-900 transition-colors"
          >
            View Stadium Matches
          </Link>
          <Link
            href="/fighter-program"
            className="hover:bg-white px-8 py-4 border-2 border-white rounded-lg w-full sm:w-auto font-semibold text-white hover:text-zinc-900 transition-colors"
          >
            Fighter Application
          </Link>
        </div>
      </div>
    </div>
  );
}

