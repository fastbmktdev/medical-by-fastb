"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { Link } from '@/navigation';
import Image from "next/image";
import {
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

// --- Data ---
const BENEFITS = [
  {
    icon: TrophyIcon,
    title: "โอกาสในการแข่งขัน",
    description: "เข้าถึงการแข่งขันสุดพิเศษและไต่อันดับในวงการมวยไทย",
  },
  {
    icon: AcademicCapIcon,
    title: "การฝึกสอนระดับโลก",
    description: "เรียนรู้จากโค้ชและแชมป์มวยไทยที่มีชื่อเสียง",
  },
  {
    icon: UserGroupIcon,
    title: "ส่วนหนึ่งของชุมชน",
    description: "เชื่อมต่อกับนักมวยคนอื่นๆ และเป็นส่วนหนึ่งของครอบครัวเรา",
  },
  {
    icon: ShieldCheckIcon,
    title: "การสนับสนุนครบวงจร",
    description: "รับการสนับสนุนด้านโภชนาการ, การตลาด และการจัดการ",
  },
];

const TIERS = [
  {
    name: "Rising Star (ดาวรุ่ง)",
    price: "เริ่มต้น",
    features: [
      "แผนการฝึกซ้อมพื้นฐาน",
      "เข้าร่วมการแข่งขันระดับท้องถิ่น",
      "สิทธิ์เข้าใช้ยิมในเครือ",
      "ส่วนลดอุปกรณ์ 10%",
    ],
    cta: "สมัครระดับดาวรุ่ง",
    href: "/signup?tier=rising-star",
  },
  {
    name: "Champion (แชมป์เปี้ยน)",
    price: "มืออาชีพ",
    features: [
      "ทุกอย่างในระดับดาวรุ่ง",
      "แผนการฝึกซ้อมส่วนตัวกับโค้ช",
      "เข้าร่วมการแข่งขันระดับประเทศ",
      "สนับสนุนด้านโภชนาการ",
      "โปรโมทผ่านช่องทางของเรา",
    ],
    cta: "สมัครระดับแชมป์เปี้ยน",
    href: "/signup?tier=champion",
  },
  {
    name: "Legend (ตำนาน)",
    price: "ติดต่อเรา",
    features: [
      "ทุกอย่างในระดับแชมป์เปี้ยน",
      "ฝึกซ้อมกับนักมวยระดับตำนาน",
      "เข้าร่วมการแข่งขันระดับนานาชาติ",
      "ทีมงานจัดการส่วนตัว",
      "สปอนเซอร์และพาร์ทเนอร์",
    ],
    cta: "ติดต่อเพื่อสมัคร",
    href: "/contact?for=legend-fighter",
  },
];

const TIMELINE = [
  {
    step: "01",
    title: "กรอกใบสมัครออนไลน์",
    description: "ส่งใบสมัครออนไลน์พร้อมวิดีโอการซ้อมและข้อมูลส่วนตัวของคุณ",
    details: [
      "กรอกข้อมูลส่วนตัวและประวัติการฝึกซ้อม",
      "อัพโหลดวิดีโอการซ้อม (3-5 นาที)",
      "แนบเอกสารประกอบ (บัตรประชาชน, ใบรับรองแพทย์)",
      "ระบุระดับประสบการณ์และเป้าหมาย"
    ],
    duration: "5-10 นาที",
    icon: "📝"
  },
  {
    step: "02",
    title: "การคัดเลือกและสัมภาษณ์",
    description: "ทีมงานของเราจะตรวจสอบใบสมัครและติดต่อกลับเพื่อทำการสัมภาษณ์",
    details: [
      "ตรวจสอบเอกสารและวิดีโอการซ้อม",
      "สัมภาษณ์ผ่านวิดีโอคอล (15-20 นาที)",
      "ประเมินความเหมาะสมกับโปรแกรม",
      "แจ้งผลการคัดเลือกรอบแรก"
    ],
    duration: "3-5 วันทำการ",
    icon: "🎯"
  },
  {
    step: "03",
    title: "ทดสอบฝีมือและสมรรถภาพ",
    description: "เข้าร่วมการทดสอบฝีมือและสมรรถภาพร่างกายกับโค้ชของเรา",
    details: [
      "ทดสอบทักษะมวยไทยพื้นฐาน",
      "ประเมินสมรรถภาพร่างกาย",
      "ทดสอบจิตใจและความมุ่งมั่น",
      "แนะนำแผนการฝึกซ้อมส่วนตัว"
    ],
    duration: "2-3 ชั่วโมง",
    icon: "🥊"
  },
  {
    step: "04",
    title: "เซ็นสัญญาและเริ่มต้น",
    description: "เมื่อผ่านการคัดเลือก คุณจะได้เป็นส่วนหนึ่งของโปรแกรมนักมวยของเรา",
    details: [
      "เซ็นสัญญาเข้าร่วมโปรแกรม",
      "รับแผนการฝึกซ้อมส่วนตัว",
      "แนะนำทีมโค้ชและนักมวยคนอื่นๆ",
      "เริ่มต้นเส้นทางสู่การเป็นแชมป์"
    ],
    duration: "1-2 วันทำการ",
    icon: "🏆"
  },
];

const TESTIMONIALS = [
  {
    name: "สมศักดิ์ ศิษย์หลวงพ่อ",
    role: "แชมป์เปี้ยนรุ่นไลท์เวท",
    quote:
      "โปรแกรมนี้เปลี่ยนชีวิตผมไปเลย จากนักมวยโนเนมสู่การเป็นแชมป์เปี้ยน ผมได้รับการสนับสนุนที่ดีที่สุดในทุกๆ ด้าน",
    avatar: "/assets/images/fighters/fighter-1.jpg",
  },
  {
    name: "มานี ใจดี",
    role: "นักมวยหญิงดาวรุ่ง",
    quote:
      "โค้ชและทีมงานยอดเยี่ยมมากค่ะ พวกเขาผลักดันให้ฉันเก่งขึ้นทุกวัน และชุมชนที่นี่ก็อบอุ่นเหมือนครอบครัว",
    avatar: "/assets/images/fighters/fighter-2.jpg",
  },
  {
    name: "วิชิต สิงห์สนาม",
    role: "นักมวยต่างชาติ",
    quote:
      "ในฐานะชาวต่างชาติ ผมรู้สึกได้รับการต้อนรับอย่างดีเยี่ยม ที่นี่มีทุกอย่างที่ผมต้องการเพื่อโฟกัสกับการชกมวย",
    avatar: "/assets/images/fighters/fighter-3.jpg",
  },
];

const FAQS = [
  {
    question: "ต้องมีประสบการณ์เท่าไหร่ถึงจะสมัครได้?",
    answer:
      "สำหรับระดับ Rising Star เราเปิดรับผู้ที่มีประสบการณ์มวยไทยพื้นฐาน ส่วนระดับ Champion และ Legend จะต้องผ่านการคัดเลือกที่เข้มข้นกว่าและมีประสบการณ์การแข่งขันมาก่อน",
  },
  {
    question: "มีค่าใช้จ่ายในการเข้าร่วมโปรแกรมหรือไม่?",
    answer:
      "โปรแกรมของเราไม่มีค่าใช้จ่ายในการสมัคร แต่จะมีการหักเปอร์เซ็นต์จากค่าตัวในการแข่งขันตามที่ระบุไว้ในสัญญาแต่ละระดับ",
  },
  {
    question: "โปรแกรมนี้สำหรับคนไทยเท่านั้นหรือไม่?",
    answer:
      "เราเปิดรับนักมวยจากทั่วโลกที่มีความสามารถและความมุ่งมั่น ไม่ว่าคุณจะมาจากที่ไหนก็สามารถสมัครได้",
  },
  {
    question: "จะเกิดอะไรขึ้นหากได้รับบาดเจ็บ?",
    answer:
      "เรามีทีมแพทย์และนักกายภาพบำบัดคอยดูแลอย่างใกล้ชิด นอกจากนี้ยังมีประกันอุบัติเหตุกลุ่มสำหรับนักมวยในโปรแกรมทุกคน",
  },
];

// --- Animations & UI Components --
interface AnimationComponentProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}
const FadeInUp: React.FC<AnimationComponentProps> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const StaggeredFadeIn: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={`transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: `${index * 200}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

const FloatingCard: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl ${className}`}
  >
    {children}
  </div>
);

const FaqItem: React.FC<{ faq: { question: string; answer: string } }> = ({
  faq,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="py-6 border-zinc-700 border-b transition-all duration-300 hover:bg-zinc-800/50 rounded-lg px-4 -mx-4">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex justify-between items-center w-full text-left group"
      >
        <h3 className="font-medium text-lg group-hover:text-red-400 transition-colors">
          {faq.question}
        </h3>
        <ChevronDownIcon
          className={`h-6 w-6 text-zinc-400 transition-all duration-300 ${
            isOpen
              ? "transform rotate-180 text-red-400"
              : "group-hover:text-red-400"
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-4 pr-12">
          <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
};

// --- Section Components ---

function HeroSection() {
  return (
    <section className="relative flex justify-center items-center px-4 h-[40vh] md:h-[60vh] text-center overflow-hidden">
      <div
        className="z-0 absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/images/bg-main.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent" />
      </div>
      <div className="z-10 relative">
        <FadeInUp delay={200}>
          <div className="flex items-center justify-center mb-4">
            <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">
              โปรแกรมนักมวยระดับโลก
            </span>
          </div>
        </FadeInUp>
        <FadeInUp delay={400}>
          <h1 className="mb-6 font-bold text-4xl md:text-6xl lg:text-7xl tracking-tight text-white">
            เส้นทางสู่การเป็นแชมป์
          </h1>
        </FadeInUp>
        <FadeInUp delay={600}>
          <p className="mx-auto mb-8 max-w-3xl text-zinc-300 text-lg md:text-xl lg:text-2xl leading-relaxed">
            เข้าร่วมโปรแกรมที่ออกแบบมาเพื่อปั้นนักมวยไทยสู่เวทีระดับโลก
          </p>
        </FadeInUp>
        <FadeInUp delay={800}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#apply"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-500/25"
            >
              สมัครเข้าร่วมโปรแกรม
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#tiers"
              className="inline-flex items-center gap-2 border border-red-500 hover:bg-red-500 px-8 py-4 rounded-lg font-bold text-red-400 hover:text-white text-lg transition-all duration-300"
            >
              ดูระดับโปรแกรม
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <FadeInUp>
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full mb-6">
              <StarIcon className="w-5 h-5 text-red-500" />
              <span className="text-red-400 font-semibold text-sm">
                ทำไมต้องเลือกเรา
              </span>
            </div>
            <h2 className="font-bold text-3xl md:text-4xl mb-4">
              ทำไมต้องเข้าร่วมกับเรา?
            </h2>
            <p className="mx-auto max-w-2xl text-zinc-400 text-lg leading-relaxed">
              เรามอบการสนับสนุนที่ครบวงจรเพื่อให้นักมวยของเราประสบความสำเร็จสูงสุด
            </p>
          </div>
        </FadeInUp>
        <StaggeredFadeIn className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <FloatingCard key={title} className="group">
              <div className="flex flex-col items-center bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-xl p-8 rounded-2xl text-center border border-zinc-700 group-hover:border-red-500/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="mb-6 p-4 bg-red-500/10 rounded-full group-hover:bg-red-500/20 transition-colors duration-300 w-16 h-16 flex items-center justify-center mx-auto">
                    <Icon className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="mb-3 font-bold text-xl group-hover:text-red-400 transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                    {description}
                  </p>
                </div>
              </div>
            </FloatingCard>
          ))}
        </StaggeredFadeIn>
      </div>
    </section>
  );
}

function TiersSection() {
  return (
    <section
      id="tiers"
      className="bg-zinc-950 py-16 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-transparent to-yellow-900/5" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <FadeInUp>
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 border border-yellow-500">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-400 font-semibold text-sm">
                ระดับโปรแกรม
              </span>
            </div>
            <h2 className="font-bold text-3xl md:text-4xl mb-4">
              เลือกระดับที่เหมาะกับคุณ
            </h2>
            <p className="mx-auto max-w-2xl text-zinc-400 text-lg leading-relaxed">
              เรามีโปรแกรมที่หลากหลายเพื่อตอบสนองเส้นทางอาชีพของนักมวยทุกคน
            </p>
          </div>
        </FadeInUp>
        <StaggeredFadeIn className="items-stretch gap-8 grid grid-cols-1 lg:grid-cols-3">
          {TIERS.map((tier, index) => (
            <FloatingCard key={tier.name} className="group">
              <div
                className={`bg-gradient-to-b from-zinc-900 to-zinc-800 rounded-2xl p-8 flex flex-col shadow-2xl border transition-all duration-300 relative overflow-hidden ${
                  index === 1
                    ? "border border-red-500 scale-105 shadow-red-500/25 flex items-center justify-center"
                    : "border-zinc-700 group-hover:border-red-500/50"
                }`}
              >
                <div className="w-full relative z-10">
                  {index === 1 && (
                    <div className="mb-6 text-center">
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                        <StarIcon className="w-4 h-4" />
                        ยอดนิยม
                      </span>
                    </div>
                  )}
                  <h3 className="font-bold text-2xl text-center mb-2 group-hover:text-red-400 transition-colors duration-300">
                    {tier.name}
                  </h3>
                  <p className="mb-8 text-zinc-400 text-center text-lg font-semibold">
                    {tier.price}
                  </p>

                  <ul className="flex-grow space-y-4 mb-8">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 group/item"
                      >
                        <CheckBadgeIcon className="w-6 h-6 text-green-500 group-hover/item:scale-110 transition-transform duration-200" />
                        <span className="text-zinc-300 group-hover/item: transition-colors duration-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.href}
                    className={`group/btn w-full text-center font-bold py-4 px-6 rounded-lg transition-all duration-300 transform ${
                      index === 1
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25 border border-red-500 flex items-center justify-center w-full"
                        : "bg-zinc-700 hover:bg-brand-primary hover:shadow-lg border flex items-center justify-center"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {tier.cta}
                      <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
              </div>
            </FloatingCard>
          ))}
        </StaggeredFadeIn>
      </div>
    </section>
  );
}

function TimelineSection() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <section id="apply" className="py-16 relative">
      <div className="absolute inset-0 bg-transparent" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
        <FadeInUp>
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full mb-6">
              <AcademicCapIcon className="w-5 h-5 text-blue-500" />
              <span className="text-blue-400 font-semibold text-sm">
                ขั้นตอนการสมัคร
              </span>
            </div>
            <h2 className="font-bold text-3xl md:text-4xl mb-4">
              ขั้นตอนการสมัคร
            </h2>
            <p className="mx-auto max-w-2xl text-zinc-400 text-lg leading-relaxed">
              เพียง 4 ขั้นตอนง่ายๆ ในการเริ่มต้นเส้นทางสู่การเป็นนักมวยอาชีพ
            </p>
          </div>
        </FadeInUp>
        
        <div className="relative">
          <ol className="relative">
            {TIMELINE.map((item, index) => (
              <FadeInUp key={item.step} delay={index * 200}>
                <li className="mb-8 ml-10 group">
                  <div className="relative">
                    <span className="-left-5 absolute flex justify-center items-center bg-gradient-to-br from-red-500 to-red-600 rounded-full ring-8 ring-zinc-900 w-12 h-12 font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                    </span>
                    
                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl border border-zinc-700 group-hover:border-red-500/50 transition-all duration-300 group-hover:shadow-xl overflow-hidden">
                      <div className="p-[24px_24px_24px_48px]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <h3 className="font-bold text-xl group-hover:text-red-400 transition-colors duration-300">
                              {item.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                              {item.duration}
                            </span>
                            <button
                              onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                              className="text-zinc-400 hover:text-red-400 transition-colors duration-200"
                            >
                              <ChevronDownIcon 
                                className={`w-5 h-5 transition-transform duration-200 ${
                                  expandedStep === index ? 'rotate-180' : ''
                                }`} 
                              />
                            </button>
                          </div>
                        </div>
                        
                        <p className="font-normal text-zinc-400 text-base leading-relaxed group-hover:text-zinc-300 transition-colors duration-300 mb-4">
                          {item.description}
                        </p>
                        
                        {expandedStep === index && (
                          <div className="mt-4 p-4 bg-zinc-700/50 rounded-lg border border-zinc-600">
                            <h4 className="text-sm font-semibold text-red-400 mb-3">รายละเอียดขั้นตอน:</h4>
                            <ul className="space-y-2">
                              {item.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2 text-sm text-zinc-300">
                                  <span className="text-red-400 mt-1">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              </FadeInUp>
            ))}
          </ol>
        </div>
        
        {/* Call to action for application */}
        <FadeInUp delay={1000}>
          <div className="mt-12 text-center">
            <div className="bg-transparent rounded-2xl p-8 border border-red-500/20">
              <h3 className="text-2xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h3>
              <p className="text-zinc-400 mb-6">เริ่มต้นเส้นทางสู่การเป็นแชมป์ด้วยการสมัครออนไลน์</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
                >
                  <span>เริ่มสมัครเลย</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-red-500 hover:bg-red-500 px-8 py-3 rounded-lg font-bold text-red-400 hover:text-white transition-all duration-300"
                >
                  <span>สอบถามข้อมูล</span>
                </Link>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-zinc-950 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-blue-900/5" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <FadeInUp>
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full mb-6">
              <UserGroupIcon className="w-5 h-5 text-purple-500" />
              <span className="text-purple-400 font-semibold text-sm">
                เสียงจากนักมวย
              </span>
            </div>
            <h2 className="font-bold text-3xl md:text-4xl mb-4">
              เสียงจากนักมวยของเรา
            </h2>
            <p className="mx-auto max-w-2xl text-zinc-400 text-lg leading-relaxed">
              ดูว่านักมวยในโปรแกรมของเราพูดถึงประสบการณ์ของพวกเขาอย่างไร
            </p>
          </div>
        </FadeInUp>
        <StaggeredFadeIn className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          {TESTIMONIALS.map(({ name, role, quote, avatar }) => (
            <FloatingCard key={name} className="group">
              <div className="flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-800 shadow-xl p-8 rounded-2xl border border-zinc-700 group-hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="mb-6 flex justify-center">
                    <div className="p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-grow mb-6">
                    <p className="text-zinc-300 italic text-lg leading-relaxed group-hover:text-zinc-200 transition-colors duration-300">
                      &#34;{quote}&quot;
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="relative">
                      <Image
                        width={400}
                        height={400}
                        className="mr-4 rounded-full w-14 h-14 object-cover border border-zinc-700 group-hover:border-purple-500/50 transition-colors duration-300"
                        src={avatar}
                        alt={name}
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border border-zinc-900" />
                    </div>
                    <div>
                      <p className="font-bold group-hover:text-purple-400 transition-colors duration-300">
                        {name}
                      </p>
                      <p className="text-zinc-400 text-sm group-hover:text-zinc-300 transition-colors duration-300">
                        {role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FloatingCard>
          ))}
        </StaggeredFadeIn>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 bg-transparent" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl relative z-10">
        <FadeInUp>
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full mb-6">
              <ShieldCheckIcon className="w-5 h-5 text-green-500" />
              <span className="text-green-400 font-semibold text-sm">
                คำถามที่พบบ่อย
              </span>
            </div>
            <h2 className="font-bold text-3xl md:text-4xl mb-4">
              คำถามที่พบบ่อย
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              คำตอบสำหรับคำถามที่นักมวยมักจะสงสัย
            </p>
          </div>
        </FadeInUp>
        <StaggeredFadeIn>
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-6 border border-zinc-700">
            {FAQS.map((faq, idx) => (
              <FaqItem key={idx} faq={faq} />
            ))}
          </div>
        </StaggeredFadeIn>
      </div>
    </section>
  );
}

function CallToActionSection() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10">
        <FadeInUp delay={200}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-transparent px-6 py-3 rounded-full mb-6 border border-yellow-500">
              <TrophyIcon className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-300 font-bold text-sm uppercase tracking-wider">
                เริ่มต้นเส้นทางของคุณ
              </span>
            </div>
          </div>
        </FadeInUp>
        <FadeInUp delay={400}>
          <h2 className="mb-6 font-bold text-4xl md:text-5xl lg:text-6xl bg-transparent bg-clip-text text-white">
            พร้อมที่จะขึ้นสังเวียนหรือยัง?
          </h2>
        </FadeInUp>
        <FadeInUp delay={600}>
          <p className="mb-10 text-zinc-300 text-xl leading-relaxed max-w-2xl mx-auto">
            อย่าปล่อยให้ความฝันของคุณเป็นเพียงแค่ความฝัน
            เข้าร่วมกับเราและสร้างตำนานของคุณเอง
          </p>
        </FadeInUp>
        <FadeInUp delay={800}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-10 py-5 rounded-lg font-bold text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-500/25"
            >
              <TrophyIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              สมัครเลย
              <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-red-500 hover:bg-red-500 px-8 py-4 rounded-lg font-bold text-red-400 hover:text-white text-lg transition-all duration-300"
            >
              ติดต่อสอบถาม
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}

// --- Main Page ---

export default function FighterProgramPage() {
  return (
    <div className="bg-transparent text-white">
      <HeroSection />
      <BenefitsSection />
      <TiersSection />
      <TimelineSection />
      <TestimonialsSection />
      <FAQSection />
      <CallToActionSection />
    </div>
  );
}
