"use client";
import Link from "next/link";

const LANGUAGES = {
  th: {
    welcome: "ยินดีต้อนรับสู่ MUAYTHAI NEXT",
    title: "ทุกการต่อสู้ที่ยิ่งใหญ่ เริ่มต้นจากการเตรียมตัวที่ดี",
    subtitle: "การเดินทางเริ่มต้นด้วยก้าวแรก!",
    description: "เข้าร่วมชุมชนของเราและเป็นส่วนหนึ่งของนักมวยไทยรุ่นต่อไป",
    cta: [
      {
        href: "/gyms",
        label: "จองค่ายมวย",
        style: "bg-red-600 hover:bg-red-500",
      },
      {
        href: "/events",
        label: "ดูแมตช์ในสนาม",
        style: "bg-zinc-700 hover:bg-zinc-600",
      },
      {
        href: "/fighters/apply",
        label: "สมัครเป็นนักสู้",
        style: "bg-transparent border border-white hover:bg-white/10",
      },
    ],
  },
  en: {
    welcome: "WELCOME TO MUAYTHAI NEXT",
    title: "EVERY GREAT FIGHT STARTS WITH A GREAT PREPARATION",
    subtitle: "JOURNEY STARTS WITH ONE STEP!",
    description:
      "JOIN OUR COMMUNITY AND BE PART OF THE NEXT GENERATION OF MUAYTHAI FIGHTERS",
    cta: [
      {
        href: "/gyms",
        label: "Book Muay Thai Gyms",
        style: "bg-red-600 hover:bg-red-500",
      },
      {
        href: "/events",
        label: "View Stadium Matches",
        style: "bg-zinc-700 hover:bg-zinc-600",
      },
      {
        href: "/fighters/apply",
        label: "Fighter Application",
        style: "bg-transparent border border-white hover:bg-white/10",
      },
    ],
  },
  jp: {
    welcome: "MUAYTHAI NEXTへようこそ",
    title: "すべての偉大な戦いは、偉大な準備から始まる",
    subtitle: "旅は一歩から始まる！",
    description:
      "私たちのコミュニティに参加し、次世代のムエタイファイターの一員になりましょう",
    cta: [
      {
        href: "/gyms",
        label: "ムエタイジムを予約",
        style: "bg-red-600 hover:bg-red-500",
      },
      {
        href: "/events",
        label: "スタジアムマッチを見る",
        style: "bg-zinc-700 hover:bg-zinc-600",
      },
      {
        href: "/fighters/apply",
        label: "ファイター申請",
        style: "bg-transparent border border-white hover:bg-white/10",
      },
    ],
  },
};

export default function HeroSection() {
  // Use only Thai language, no language switcher
  const content = LANGUAGES["en"];

  return (
    <section className="isolate relative h-[70vh] overflow-hidden">
      {/* Overlay */}
      <div className="-z-10 absolute inset-0 bg-black/50 h-full" />
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="-z-20 absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1593658632312-a798ac7e4413?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      >
        <source src="/assets/videos/hero-background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Hero Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-7xl h-full">
        <div className="flex justify-center items-center h-[inherit] text-center">
          <div>
            <div className="space-y-4">
              <span className="font-semibold text-red-500 text-sm uppercase tracking-wider">
                {content.welcome}
              </span>
              <h1 className="mt-4 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight">
                {content.title}
              </h1>
              <h3 className="font-bold text-white/90 text-3xl sm:text-4xl">
                {content.subtitle}
              </h3>
              <p className="mx-auto max-w-2xl text-white/70">
                {content.description}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {content.cta.map(({ href, label, style }) => (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center px-6 py-3 rounded-md font-semibold text-white text-lg transition-colors ${style}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
