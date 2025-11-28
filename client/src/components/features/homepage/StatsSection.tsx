"use client";

import { 
  BuildingOfficeIcon, 
  UserGroupIcon,
  CalendarDaysIcon,
  HeartIcon
} from "@heroicons/react/24/outline";

const STATS = [
  {
    icon: BuildingOfficeIcon,
    value: "500+",
    label: "โรงพยาบาล",
    description: "โรงพยาบาลชั้นนำทั่วประเทศ",
    color: "text-brand-primary",
    bgColor: "bg-blue-50",
  },
  {
    icon: UserGroupIcon,
    value: "50K+",
    label: "ผู้ใช้",
    description: "ผู้ใช้ที่เชื่อถือในบริการของเรา",
    color: "text-brand-secondary",
    bgColor: "bg-cyan-50",
  },
  {
    icon: HeartIcon,
    value: "99%",
    label: "ความพึงพอใจ",
    description: "คะแนนความพึงพอใจจากผู้ใช้",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-linear-to-br from-blue-50 via-white to-cyan-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="mb-4 font-semibold text-3xl md:text-4xl text-gray-900">
            ตัวเลขที่บอกเล่าเรื่องราว
          </h2>
          <p className="text-gray-600 text-lg">
            เราให้บริการทางการแพทย์ที่เชื่อถือได้และมีคุณภาพ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white  p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className={`${stat.bgColor} w-16 h-16  flex items-center justify-center mb-4`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className={`text-4xl font-semibold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="font-semibold text-gray-900 text-lg mb-1">
                  {stat.label}
                </div>
                <div className="text-gray-600 text-sm">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

