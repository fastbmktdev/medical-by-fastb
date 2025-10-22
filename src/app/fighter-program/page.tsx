"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";

const benefits = [
  {
    icon: <TrophyIcon className="w-10 h-10 text-red-500" />,
    title: "โอกาสในการแข่งขัน",
    description:
      "เข้าถึงการแข่งขันสุดพิเศษและไต่อันดับในวงการมวยไทย",
  },
  {
    icon: <AcademicCapIcon className="w-10 h-10 text-red-500" />,
    title: "การฝึกสอนระดับโลก",
    description:
      "เรียนรู้จากโค้ชและแชมป์มวยไทยที่มีชื่อเสียง",
  },
  {
    icon: <UserGroupIcon className="w-10 h-10 text-red-500" />,
    title: "ส่วนหนึ่งของชุมชน",
    description:
      "เชื่อมต่อกับนักมวยคนอื่นๆ และเป็นส่วนหนึ่งของครอบครัวเรา",
  },
  {
    icon: <ShieldCheckIcon className="w-10 h-10 text-red-500" />,
    title: "การสนับสนุนครบวงจร",
    description:
      "รับการสนับสนุนด้านโภชนาการ, การตลาด และการจัดการ",
  },
];

const tiers = [
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

const timeline = [
  {
    step: "01",
    title: "กรอกใบสมัคร",
    description:
      "ส่งใบสมัครออนไลน์พร้อมวิดีโอการซ้อมและข้อมูลส่วนตัวของคุณ",
  },
  {
    step: "02",
    title: "การคัดเลือกและสัมภาษณ์",
    description:
      "ทีมงานของเราจะตรวจสอบใบสมัครและติดต่อกลับเพื่อทำการสัมภาษณ์",
  },
  {
    step: "03",
    title: "ทดสอบฝีมือ",
    description:
      "เข้าร่วมการทดสอบฝีมือและสมรรถภาพร่างกายกับโค้ชของเรา",
  },
  {
    step: "04",
    title: "เซ็นสัญญาและเริ่มต้น",
    description:
      "เมื่อผ่านการคัดเลือก คุณจะได้เป็นส่วนหนึ่งของโปรแกรมนักมวยของเรา",
  },
];

const testimonials = [
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

const faqs = [
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

const FaqItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-6 border-zinc-700 border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left"
      >
        <h3 className="font-medium text-lg">{faq.question}</h3>
        <ChevronDownIcon
          className={`h-6 w-6 text-zinc-400 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-4 pr-12">
          <p className="text-zinc-400">{faq.answer}</p>
        </div>
      )}
    </div>
  );
};

export default function FighterProgramPage() {
  return (
    <div className="bg-zinc-900 text-white">
      {/* Hero Section */}
      <section className="relative flex justify-center items-center px-4 h-[60vh] md:h-[80vh] text-center">
        <div
          className="z-0 absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/images/bg-main.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="z-10 relative">
          <h1 className="mb-4 font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight">
            เส้นทางสู่การเป็นแชมป์
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-zinc-300 text-lg md:text-xl lg:text-2xl">
            เข้าร่วมโปรแกรมที่ออกแบบมาเพื่อปั้นนักมวยไทยสู่เวทีระดับโลก
          </p>
          <Link
            href="#apply"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold text-white text-lg transition-colors"
          >
            สมัครเข้าร่วมโปรแกรม <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-extrabold text-red-500 text-3xl md:text-4xl">
              ทำไมต้องเข้าร่วมกับเรา?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-lg">
              เรามอบการสนับสนุนที่ครบวงจรเพื่อให้นักมวยของเราประสบความสำเร็จสูงสุด
            </p>
          </div>
          <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col items-center bg-zinc-800 shadow-lg p-8 rounded-2xl text-center hover:scale-105 transition-transform duration-300 transform"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="mb-2 font-bold text-xl">{benefit.title}</h3>
                <p className="text-zinc-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section id="tiers" className="bg-zinc-950 py-16 sm:py-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-extrabold text-3xl md:text-4xl">
              เลือกระดับที่เหมาะกับคุณ
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-lg">
              เรามีโปรแกรมที่หลากหลายเพื่อตอบสนองเส้นทางอาชีพของนักมวยทุกคน
            </p>
          </div>
          <div className="items-stretch gap-8 grid grid-cols-1 lg:grid-cols-3">
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`bg-zinc-900 rounded-2xl p-8 flex flex-col shadow-2xl ${
                  index === 1 ? "border-2 border-red-500 scale-105" : ""
                }`}
              >
                {index === 1 && (
                  <div className="mb-4 text-center">
                    <span className="bg-red-500 px-4 py-1 rounded-full font-bold text-white text-sm">
                      ยอดนิยม
                    </span>
                  </div>
                )}
                <h3 className="font-bold text-2xl text-center">{tier.name}</h3>
                <p className="mb-6 text-zinc-400 text-center">{tier.price}</p>
                <ul className="flex-grow space-y-4 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`w-full text-center font-bold py-3 px-6 rounded-lg transition-colors ${
                    index === 1
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-zinc-700 hover:bg-zinc-600 text-white"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How to Apply Timeline Section */}
      <section id="apply" className="py-16 sm:py-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="font-extrabold text-3xl md:text-4xl">
              ขั้นตอนการสมัคร
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-lg">
              เพียง 4 ขั้นตอนง่ายๆ ในการเริ่มต้นเส้นทางสู่การเป็นนักมวยอาชีพ
            </p>
          </div>
          <ol className="relative border-zinc-700 border-l">
            {timeline.map((item) => (
              <li key={item.step} className="mb-10 ml-10">
                <span className="-left-5 absolute flex justify-center items-center bg-zinc-800 rounded-full ring-8 ring-zinc-900 w-10 h-10 font-bold text-red-500">
                  {item.step}
                </span>
                <h3 className="mb-1 font-bold text-white text-xl">
                  {item.title}
                </h3>
                <p className="font-normal text-zinc-400 text-base">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-zinc-950 py-16 sm:py-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-extrabold text-3xl md:text-4xl">
              เสียงจากนักมวยของเรา
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-lg">
              ดูว่านักมวยในโปรแกรมของเราพูดถึงประสบการณ์ของพวกเขาอย่างไร
            </p>
          </div>
          <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="flex flex-col bg-zinc-900 shadow-lg p-8 rounded-2xl"
              >
                <div className="flex-grow mb-4">
                  <p className="text-zinc-300 italic">&#34;{testimonial.quote}&quot;</p>
                </div>
                <div className="flex items-center mt-4">
                  <Image
                    width={400}
                    height={400}
                    className="mr-4 rounded-full w-12 h-12 object-cover"
                    src={testimonial.avatar}
                    alt={testimonial.name}
                  />
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-zinc-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="font-extrabold text-3xl md:text-4xl">
              คำถามที่พบบ่อย
            </h2>
          </div>
          <div>
            {faqs.map((faq, index) => (
              <FaqItem key={index} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-red-800/20 py-16 sm:py-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="mb-4 font-extrabold text-3xl md:text-4xl">
            พร้อมที่จะขึ้นสังเวียนหรือยัง?
          </h2>
          <p className="mb-8 text-zinc-300 text-lg">
            อย่าปล่อยให้ความฝันของคุณเป็นเพียงแค่ความฝัน
            เข้าร่วมกับเราและสร้างตำนานของคุณเอง
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-10 py-4 rounded-full font-bold text-white text-xl transition-colors"
          >
            สมัครเลย
          </Link>
        </div>
      </section>
    </div>
  );
}
