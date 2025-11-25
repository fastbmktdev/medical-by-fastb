"use client";

import Link from "next/link";
import { Button } from "@/components/shared";
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  HeartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const SERVICES = [
  {
    icon: BuildingOfficeIcon,
    title: "ค้นหาโรงพยาบาล",
    description: "ค้นหาและจองโรงพยาบาลชั้นนำทั่วประเทศไทย",
    href: "/hospitals",
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: ShoppingBagIcon,
    title: "ร้านค้า",
    description: "ซื้อสินค้าและแพ็กเกจทางการแพทย์",
    href: "/shop",
    color: "from-green-500 to-green-600",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: DocumentTextIcon,
    title: "บทความ",
    description: "อ่านบทความและข่าวสารทางการแพทย์",
    href: "/articles",
    color: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: HeartIcon,
    title: "ดูแลสุขภาพ",
    description: "บริการดูแลสุขภาพและให้คำปรึกษา",
    href: "/hospitals",
    color: "from-pink-500 to-pink-600",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: UserGroupIcon,
    title: "ชุมชน",
    description: "เข้าร่วมชุมชนและแลกเปลี่ยนประสบการณ์",
    href: "/dashboard",
    color: "from-indigo-500 to-indigo-600",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl text-gray-900">
            บริการของเรา
          </h2>
          <p className="text-gray-600 text-lg">
            แพลตฟอร์มที่ครอบคลุมทุกความต้องการทางการแพทย์
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link
                key={index}
                href={service.href}
                className="group bg-white border border-gray-200  p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`${service.iconBg} w-14 h-14  flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${service.iconColor}`} />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
                <div className="mt-4 flex items-center text-brand-primary font-medium group-hover:gap-2 transition-all">
                  ดูเพิ่มเติม
                  <svg
                    className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
          >
            <Link href="/about">เรียนรู้เพิ่มเติมเกี่ยวกับเรา</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

