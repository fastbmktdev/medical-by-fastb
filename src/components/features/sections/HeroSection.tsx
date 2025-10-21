"use client";

import Link from "next/link";

const HERO_HEADINGS = {
  subheading: "WELCOME TO THAIKICK MUAYTHAI",
  heading: (
    <>
      EVERY GREAT FIGHT STARTS
      <br />
      WITH A GREAT PREPARATION
    </>
  ),
  slogan: "JOURNEY STARTS WITH ONE STEP!",
  description:
    "JOIN OUR COMMUNITY AND BE PART OF THE NEXT GENERATION OF MUAYTHAI FIGHTERS",
};

const CTA_BUTTONS = [
  {
    href: "/gyms",
    label: "Book Muay Thai Gyms",
    className:
      "bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg w-full sm:w-auto font-semibold text-white transition-colors",
  },
  {
    href: "/events",
    label: "View Stadium Matches",
    className:
      "bg-white hover:bg-zinc-100 px-8 py-4 rounded-lg w-full sm:w-auto font-semibold text-zinc-900 transition-colors",
  },
  {
    href: "/fighter-program",
    label: "Fighter Application",
    className:
      "hover:bg-white px-8 py-4 border-2 border-white rounded-lg w-full sm:w-auto font-semibold text-white hover:text-zinc-900 transition-colors",
  },
];

function VideoBackground() {
  return (
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
  );
}

function Overlay() {
  return <div className="absolute inset-0 bg-black/60" />;
}

function HeroContent() {
  return (
    <div className="z-10 relative flex flex-col justify-center items-center mx-auto px-4 max-w-7xl h-[calc(100vh_-_116px)] text-center">
      <p className="mb-4 font-semibold text-red-500 text-sm md:text-base tracking-wider">
        {HERO_HEADINGS.subheading}
      </p>
      <h1 className="mb-6 font-bold text-white text-4xl md:text-6xl lg:text-7xl leading-18">
        {HERO_HEADINGS.heading}
      </h1>
      <p className="mb-4 text-zinc-300 text-xl md:text-2xl">
        {HERO_HEADINGS.slogan}
      </p>
      <p className="mx-auto mb-12 max-w-3xl text-zinc-400 text-base md:text-lg">
        {HERO_HEADINGS.description}
      </p>
      <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
        {CTA_BUTTONS.map(({ href, label, className }) => (
          <Link key={href} href={href} className={className}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <div className="relative flex justify-center items-center mt-16 overflow-hidden">
      <div className="bottom-0 left-0 z-10 absolute bg-gradient-to-t from-zinc-950 to-transparent w-full h-1/5"></div>
      <VideoBackground />
      <Overlay />
      <HeroContent />
    </div>
  );
}
