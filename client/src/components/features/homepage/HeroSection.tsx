"use client";

import Link from "next/link";
import { Button } from "@/components/shared";
import { 
  BuildingOfficeIcon, 
  CalendarDaysIcon,
  HeartIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

const HERO_HEADINGS = {
  subheading: "ยินดีต้อนรับสู่แพลตฟอร์มการแพทย์",
  heading: (
    <>
      ค้นหาและจองโรงพยาบาล
      <br />
      <span className="text-brand-primary">ชั้นนำ</span>ได้ง่ายๆ
    </>
  ),
  description:
    "แพลตฟอร์มสำหรับค้นหาและจองโรงพยาบาลชั้นนำ ตั๋วห้องตรวจ และบริการทางการแพทย์ทั่วประเทศไทย",
};

const CTA_BUTTONS = [
  {
    href: "/hospitals",
    label: "ค้นหาโรงพยาบาล",
    variant: "primary" as const,
    icon: BuildingOfficeIcon,
  },
];

const FEATURES = [
  {
    icon: ShieldCheckIcon,
    text: "เชื่อถือได้",
    description: "โรงพยาบาลที่ผ่านการตรวจสอบ",
  },
  {
    icon: HeartIcon,
    text: "ดูแลสุขภาพ",
    description: "บริการทางการแพทย์คุณภาพ",
  },
  {
    icon: BuildingOfficeIcon,
    text: "ครอบคลุม",
    description: "โรงพยาบาลทั่วประเทศไทย",
  },
];

function VideoBackground() {
  return (
    <>
      {[
        {
          src: "/assets/videos/hero-background-1.mp4",
          type: "video/mp4",
          style: {},
        },
        {
          src: "/assets/videos/hero-background-2.mp4",
          type: "video/mp4",
          style: { display: "none" },
        },
      ].map((video, idx) => (
        <video
          key={video.src}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={video.style}
        >
          <source src={video.src} type={video.type} />
          Your browser does not support the video tag.
        </video>
      ))}
    </>
  );
}

function Overlay() {
  return (
    <div className="absolute inset-0 bg-linear-to-b from-blue-950/70 via-blue-950/60 to-blue-950/80" />
  );
}

function HeroContent() {
  return (
    <div className="z-10 relative flex flex-col justify-center items-center mx-auto px-4 max-w-7xl min-h-[calc(100vh-116px)] text-center py-20">
      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 ">
        <div className="w-2 h-2 bg-brand-primary  animate-pulse"></div>
        <p className="font-medium text-zinc-950 text-xs md:text-sm tracking-wider">
          {HERO_HEADINGS.subheading}
        </p>
      </div>

      {/* Main Heading */}
      <h1 className="mb-6 text-zinc-950 text-4xl md:text-5xl lg:text-7xl leading-tight text-balance font-medium">
        {HERO_HEADINGS.heading}
      </h1>

      {/* Description */}
      <p className="mx-auto mb-12 max-w-2xl text-zinc-950/90 text-lg md:text-xl leading-relaxed text-balance">
        {HERO_HEADINGS.description}
      </p>

      {/* CTA Buttons */}
      <div className="flex sm:flex-row flex-col justify-center items-center gap-4 mb-16">
        {CTA_BUTTONS.map(({ href, label, variant, icon: Icon }) => (
          <Button
            key={href}
            asChild
            variant={variant}
            size="xl"
            className="w-full sm:w-auto min-w-[200px]"
          >
            <Link href={href} className="flex items-center justify-center gap-2">
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {FEATURES.map(({ icon: Icon, text, description }) => (
          <div
            key={text}
            className="bg-white/10 backdrop-blur-md border border-white/20  p-6 hover:bg-white/15 transition-all"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-brand-primary/20 p-3 ">
                <Icon className="w-8 h-8 text-brand-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-zinc-950 text-lg mb-2">{text}</h3>
            <p className="text-zinc-950/80 text-sm">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative bg-linear-to-br from-blue-50 via-white to-blue-50 flex justify-center items-center min-h-screen overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent" />
      
      {/* Video Background (if available) */}
      <VideoBackground />
      
      {/* Overlay */}
      <Overlay />
      
      {/* Content */}
      <HeroContent />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-primary/10  blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-secondary/10  blur-3xl"></div>
    </section>
  );
}
