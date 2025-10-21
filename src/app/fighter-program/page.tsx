"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function FighterProgramPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const benefits = [
    {
      icon: <TrophyIcon className="w-8 h-8 text-yellow-500" />,
      title: "สิทธิพิเศษในการแข่งขัน",
      description:
        "เข้าร่วมการแข่งขันมวยไทยระดับต่างๆ ได้โดยไม่ต้องผ่านการคัดเลือก",
    },
    {
      icon: <StarIcon className="w-8 h-8 text-blue-500" />,
      title: "แต้มสะสมและรางวัล",
      description:
        "สะสมแต้มจากการฝึกซ้อมและแข่งขัน เพื่อแลกของรางวัลและสิทธิพิเศษ",
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8 text-green-500" />,
      title: "ประกันสุขภาพ",
      description:
        "ประกันสุขภาพสำหรับนักมวยครอบคลุมการบาดเจ็บจากการฝึกซ้อมและแข่งขัน",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8 text-purple-500" />,
      title: "ชุมชนนักมวย",
      description: "เข้าร่วมชุมชนนักมวยเพื่อแลกเปลี่ยนประสบการณ์และเทคนิค",
    },
  ];

  const requirements = [
    "อายุ 18-35 ปี",
    "มีประสบการณ์การฝึกมวยไทยอย่างน้อย 6 เดือน",
    "ผ่านการตรวจสุขภาพจากแพทย์",
    "มีประกันสุขภาพ",
    "ไม่มีประวัติการบาดเจ็บร้ายแรง",
    "สามารถฝึกซ้อมได้อย่างน้อย 3 ครั้งต่อสัปดาห์",
  ];

  const documents = [
    "สำเนาบัตรประชาชน",
    "รูปถ่าย 2 นิ้ว 2 รูป",
    "ใบรับรองแพทย์",
    "ใบรับรองการฝึกซ้อมจากค่ายมวย",
    "สำเนาประกันสุขภาพ",
    "เอกสารแสดงประสบการณ์การแข่งขัน (ถ้ามี)",
  ];

  const steps = [
    {
      step: 1,
      title: "สมัครสมาชิก",
      description: "กรอกข้อมูลส่วนตัวและอัปโหลดเอกสารที่จำเป็น",
    },
    {
      step: 2,
      title: "ตรวจสอบเอกสาร",
      description: "ทีมงานจะตรวจสอบเอกสารและข้อมูลภายใน 3-5 วันทำการ",
    },
    {
      step: 3,
      title: "ทดสอบสมรรถภาพ",
      description: "ทดสอบความสามารถพื้นฐานในการชกมวย",
    },
    {
      step: 4,
      title: "อนุมัติและเปิดใช้งาน",
      description: "รับการอนุมัติและเริ่มใช้สิทธิ์ต่างๆ ได้ทันที",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-zinc-950 min-h-screen">
      {/* Hero Section */}
      <div className="mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
        <div className="text-center">
          <h1 className="mb-6 font-bold text-white text-4xl md:text-6xl">
            โปรแกรมนักมวย
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-zinc-300 text-xl">
            เข้าร่วมโปรแกรมนักมวยของเราเพื่อพัฒนาทักษะและได้รับสิทธิพิเศษต่างๆ
            พร้อมโอกาสในการแข่งขันและสะสมแต้ม
          </p>
          <Link
            href="/fighters/apply"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold text-white text-lg transition-colors"
          >
            <TrophyIcon className="w-6 h-6" />
            สมัครเป็นนักมวย
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-zinc-950 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "ภาพรวม" },
              { id: "benefits", label: "สิทธิประโยชน์" },
              { id: "requirements", label: "คุณสมบัติ" },
              { id: "process", label: "ขั้นตอนการสมัคร" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {activeTab === "overview" && (
          <div className="space-y-12">
            {/* Program Overview */}
            <div className="text-center">
              <h2 className="mb-6 font-bold text-white text-3xl">
                โปรแกรมนักมวยคืออะไร?
              </h2>
              <p className="mx-auto max-w-4xl text-zinc-300 text-lg leading-relaxed">
                โปรแกรมนักมวยเป็นโครงการพิเศษที่เปิดโอกาสให้ผู้ที่รักการชกมวยไทยได้เข้าร่วมเป็นสมาชิกพิเศษ
                เพื่อรับสิทธิประโยชน์ต่างๆ รวมถึงการแข่งขัน การสะสมแต้ม
                และการพัฒนาทักษะอย่างต่อเนื่อง
              </p>
            </div>

            {/* Stats */}
            <div className="gap-8 grid grid-cols-1 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 font-bold text-red-500 text-4xl">500+</div>
                <div className="text-zinc-400">นักมวยที่เข้าร่วม</div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-bold text-red-500 text-4xl">50+</div>
                <div className="text-zinc-400">การแข่งขันต่อปี</div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-bold text-red-500 text-4xl">100+</div>
                <div className="text-zinc-400">ค่ายมวยพันธมิตร</div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-bold text-red-500 text-4xl">95%</div>
                <div className="text-zinc-400">ความพึงพอใจ</div>
              </div>
            </div>

            {/* Features */}
            <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-zinc-950 p-6 rounded-lg text-center"
                >
                  <div className="flex justify-center mb-4">{benefit.icon}</div>
                  <h3 className="mb-3 font-semibold text-white text-xl">
                    {benefit.title}
                  </h3>
                  <p className="text-zinc-400">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "benefits" && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="mb-6 font-bold text-white text-3xl">
                สิทธิประโยชน์
              </h2>
              <p className="mx-auto max-w-3xl text-zinc-300 text-lg">
                สิทธิประโยชน์ที่คุณจะได้รับเมื่อเข้าร่วมโปรแกรมนักมวย
              </p>
            </div>

            <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
              <div className="space-y-6">
                <h3 className="mb-4 font-semibold text-white text-2xl">
                  สิทธิพิเศษ
                </h3>
                <div className="space-y-4">
                  {[
                    "เข้าร่วมการแข่งขันมวยไทยระดับต่างๆ",
                    "ลดราคาค่าใช้จ่ายในการฝึกซ้อม",
                    "เข้าถึงค่ายมวยพันธมิตรทั่วประเทศ",
                    "รับประกันสุขภาพสำหรับนักมวย",
                    "เข้าร่วมเวิร์กช็อปและเซมินาร์พิเศษ",
                    "รับของรางวัลและสิทธิพิเศษต่างๆ",
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="text-zinc-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="mb-4 font-semibold text-white text-2xl">
                  ระบบแต้มสะสม
                </h3>
                <div className="bg-zinc-950 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">ฝึกซ้อม 1 ครั้ง</span>
                      <span className="font-semibold text-yellow-500">
                        +10 แต้ม
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">เข้าร่วมการแข่งขัน</span>
                      <span className="font-semibold text-yellow-500">
                        +50 แต้ม
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">ชนะการแข่งขัน</span>
                      <span className="font-semibold text-yellow-500">
                        +100 แต้ม
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">แนะนำเพื่อนเข้าร่วม</span>
                      <span className="font-semibold text-yellow-500">
                        +25 แต้ม
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "requirements" && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="mb-6 font-bold text-white text-3xl">
                คุณสมบัติผู้สมัคร
              </h2>
              <p className="mx-auto max-w-3xl text-zinc-300 text-lg">
                คุณสมบัติและเอกสารที่จำเป็นสำหรับการสมัครเข้าร่วมโปรแกรมนักมวย
              </p>
            </div>

            <div className="gap-12 grid grid-cols-1 lg:grid-cols-2">
              <div>
                <h3 className="mb-6 font-semibold text-white text-2xl">
                  คุณสมบัติพื้นฐาน
                </h3>
                <div className="space-y-4">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-green-500" />
                      <span className="text-zinc-300">{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-6 font-semibold text-white text-2xl">
                  เอกสารที่จำเป็น
                </h3>
                <div className="space-y-4">
                  {documents.map((document, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <DocumentTextIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-500" />
                      <span className="text-zinc-300">{document}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "process" && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="mb-6 font-bold text-white text-3xl">
                ขั้นตอนการสมัคร
              </h2>
              <p className="mx-auto max-w-3xl text-zinc-300 text-lg">
                ขั้นตอนง่ายๆ ในการสมัครเข้าร่วมโปรแกรมนักมวย
              </p>
            </div>

            <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center items-center bg-red-600 mx-auto mb-4 rounded-full w-12 h-12 font-bold text-white text-xl">
                    {step.step}
                  </div>
                  <h3 className="mb-3 font-semibold text-white text-xl">
                    {step.title}
                  </h3>
                  <p className="text-zinc-400">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/fighters/apply"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold text-white text-lg transition-colors"
              >
                <TrophyIcon className="w-6 h-6" />
                เริ่มต้นสมัครเลย
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
