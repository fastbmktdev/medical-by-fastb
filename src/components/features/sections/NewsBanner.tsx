"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

// Sample news data with images - in a real app, this would come from an API
const NEWS_ITEMS = [
  {
    id: 1,
    title: "เปิดตัวโปรแกรมนักสู้รุ่นใหม่ 2025",
    description: "สมัครเข้าร่วมโปรแกรมพัฒนานักสู้รุ่นใหม่ พร้อมรับสิทธิพิเศษมากมาย",
    href: "/fighter-program",
    image: "/assets/images/bg-main.jpg",
    isNew: true,
  },
  {
    id: 2,
    title: "ค่ายมวยชั้นนำเพิ่มขึ้น 20% ในปีนี้",
    description: "พบกับค่ายมวยคุณภาพสูงกว่า 50 แห่งทั่วประเทศไทย",
    href: "/gyms",
    image: "/assets/images/fallback-img.jpg",
    isNew: false,
  },
  {
    id: 3,
    title: "ตั๋วเวทีมวยลุมพินี เปิดขายแล้ว",
    description: "จองตั๋วชมการแข่งขันมวยระดับโลกที่เวทีลุมพินี",
    href: "/events",
    image: "/assets/images/bg-main.jpg",
    isNew: true,
  },
  {
    id: 4,
    title: "โปรโมชั่นพิเศษเดือนมกราคม",
    description: "ลดราคาแพ็กเกจฝึกซ้อม 30% สำหรับสมาชิกใหม่",
    href: "/shop",
    image: "/assets/images/fallback-img.jpg",
    isNew: false,
  },
  {
    id: 5,
    title: "คอร์สฝึกซ้อมพิเศษกับโค้ชระดับโลก",
    description: "เรียนรู้เทคนิคการต่อสู้จากโค้ชมืออาชีพ พร้อมใบรับรอง",
    href: "/gyms",
    image: "/assets/images/bg-main.jpg",
    isNew: true,
  },
  {
    id: 6,
    title: "ระบบคะแนนและรางวัลใหม่",
    description: "สะสมคะแนนจากการฝึกซ้อมและแข่งขัน แลกรางวัลพิเศษ",
    href: "/dashboard/gamification",
    image: "/assets/images/fallback-img.jpg",
    isNew: true,
  },
  {
    id: 7,
    title: "การแข่งขันมวยชิงแชมป์ประจำปี",
    description: "เข้าร่วมการแข่งขันมวยระดับประเทศ พร้อมรางวัลเงินสด",
    href: "/events",
    image: "/assets/images/bg-main.jpg",
    isNew: false,
  },
];

function NewsSlide({ item, isActive }: { item: typeof NEWS_ITEMS[0]; isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <Link
      href={item.href}
      className="group relative block w-full h-64 md:h-80 rounded-lg overflow-hidden transition-all duration-500 opacity-100 scale-100"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={isActive}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6">
        {item.isNew && (
          <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            ใหม่
          </div>
        )}
        <h3 className="text-white font-bold text-lg md:text-xl mb-2 group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>
        <p className="text-zinc-300 text-sm md:text-base line-clamp-2">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function NewsBannerContent() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + NEWS_ITEMS.length) % NEWS_ITEMS.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
  };

  return (
    <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-y border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-white font-bold text-lg md:text-xl">
              ข่าวสารและโปรโมชั่น
            </h2>
          </div>
          <Link
            href="/articles?tab=news"
            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        
        {/* Slider Container */}
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden group">
          {NEWS_ITEMS.map((item, index) => (
            <NewsSlide 
              key={item.id} 
              item={item} 
              isActive={index === currentIndex} 
            />
          ))}
          
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-4 gap-2">
          {NEWS_ITEMS.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-red-500 scale-125' 
                  : 'bg-zinc-600 hover:bg-zinc-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsBanner() {
  return <NewsBannerContent />;
}
