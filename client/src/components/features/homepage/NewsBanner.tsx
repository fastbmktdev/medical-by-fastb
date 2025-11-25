"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

// Sample news data with images - in a real app, this would come from an API
const NEWS_ITEMS = [
  {
    id: 1,
    title: "โรงพยาบาลชั้นนำเพิ่มขึ้น 20% ในปีนี้",
    description: "พบกับโรงพยาบาลคุณภาพสูงกว่า 50 แห่งทั่วประเทศไทย",
    href: "/hospitals",
    image: "/assets/images/fallback-img.jpg",
    isNew: false,
  },
  {
    id: 3,
    title: "โปรโมชั่นพิเศษเดือนมกราคม",
    description: "ลดราคาแพ็กเกจการรักษา 30% สำหรับสมาชิกใหม่",
    href: "/shop",
    image: "/assets/images/fallback-img.jpg",
    isNew: false,
  },
  {
    id: 4,
    title: "คอร์สการรักษาพิเศษกับแพทย์ผู้เชี่ยวชาญระดับโลก",
    description: "เรียนรู้เทคนิคการรักษาจากแพทย์มืออาชีพ พร้อมใบรับรอง",
    href: "/hospitals",
    image: "/assets/images/bg-main.jpg",
    isNew: true,
  },
  {
    id: 5,
    title: "ระบบคะแนนและรางวัลใหม่",
    description: "สะสมคะแนนจากการใช้บริการและเข้าร่วมกิจกรรม แลกรางวัลพิเศษ",
    href: "/dashboard/gamification",
    image: "/assets/images/fallback-img.jpg",
    isNew: true,
  },
];

function NewsSlide({ item, isActive }: { item: typeof NEWS_ITEMS[0]; isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <Link
      href={item.href}
      className="group relative block w-full h-64 md:h-80  overflow-hidden transition-all duration-500 opacity-100 scale-100"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes='100%'
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={isActive}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6">
        {item.isNew && (
          <div className="absolute top-4 right-4 bg-brand-primary text-white text-xs font-bold px-3 py-1  animate-pulse shadow-lg">
            ใหม่
          </div>
        )}
        <h3 className="font-bold text-lg md:text-xl mb-2 text-white group-hover:text-brand-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-white/90 text-sm md:text-base line-clamp-2">
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
    <div className="relative bg-linear-to-r from-blue-50 via-white to-blue-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-brand-primary  animate-pulse"></div>
            <h2 className="font-bold text-lg md:text-xl text-white">
              ข่าวสารและโปรโมชั่น
            </h2>
          </div>
          <Link
            href="/articles?tab=news"
            className="text-brand-primary hover:text-[#8B5CF6] text-sm font-medium transition-colors"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        
        {/* Slider Container */}
        <div className="relative h-64 md:h-80  overflow-hidden group">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2  transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2  transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
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
              className={`w-3 h-3  transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-brand-primary scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
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
