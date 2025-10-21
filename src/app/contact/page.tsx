"use client";

import { useState } from "react";
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    inquiryType: "general"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert("ส่งข้อความเรียบร้อยแล้ว! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง");
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      inquiryType: "general"
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: <EnvelopeIcon className="w-6 h-6 text-red-500" />,
      title: "อีเมล",
      details: ["support@muaythainext.com", "info@muaythainext.com"],
      description: "ตอบกลับภายใน 24 ชั่วโมง"
    },
    {
      icon: <PhoneIcon className="w-6 h-6 text-green-500" />,
      title: "โทรศัพท์",
      details: ["+66 2-123-4567", "+66 81-234-5678"],
      description: "จันทร์-ศุกร์ 09:00-18:00 น."
    },
    {
      icon: <MapPinIcon className="w-6 h-6 text-blue-500" />,
      title: "ที่อยู่",
      details: ["123 ถนนสุขุมวิท", "แขวงคลองตัน เขตวัฒนา", "กรุงเทพฯ 10110"],
      description: "สำนักงานใหญ่"
    },
    {
      icon: <ClockIcon className="w-6 h-6 text-yellow-500" />,
      title: "เวลาทำการ",
      details: ["จันทร์-ศุกร์: 09:00-18:00", "เสาร์: 09:00-15:00", "อาทิตย์: ปิดทำการ"],
      description: "เวลาประเทศไทย"
    }
  ];

  const inquiryTypes = [
    { value: "general", label: "คำถามทั่วไป" },
    { value: "payment", label: "การชำระเงิน" },
    { value: "technical", label: "ปัญหาทางเทคนิค" },
    { value: "partnership", label: "การเป็นพาร์ทเนอร์" },
    { value: "fighter-program", label: "โปรแกรมนักมวย" },
    { value: "other", label: "อื่นๆ" }
  ];

  return (
    <div className="bg-zinc-950 min-h-screen">
      <PageHeader 
        title="ติดต่อเรา" 
        description="เราพร้อมให้ความช่วยเหลือและตอบคำถามทุกข้อสงสัย"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-12 grid grid-cols-1 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="space-y-8 lg:col-span-1">
            <div>
              <h2 className="mb-6 font-bold text-white text-2xl">ข้อมูลติดต่อ</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-white text-lg">{info.title}</h3>
                      <div className="space-y-1">
                        {info.details.map((detail, detailIndex) => (
                          <p key={detailIndex} className="text-zinc-300">{detail}</p>
                        ))}
                      </div>
                      <p className="mt-2 text-zinc-400 text-sm">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="mb-4 font-semibold text-white text-lg">ติดตามเรา</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="bg-zinc-700 hover:bg-zinc-600 p-3 rounded-lg text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="bg-zinc-700 hover:bg-zinc-600 p-3 rounded-lg text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H7.83c-.49 0-.875.385-.875.875v7.83c0 .49.385.875.875.875h8.449c.49 0 .875-.385.875-.875v-7.83c0-.49-.385-.875-.875-.875z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="bg-zinc-700 hover:bg-zinc-600 p-3 rounded-lg text-white transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-950 p-8 rounded-lg">
              <h2 className="mb-6 font-bold text-white text-2xl">ส่งข้อความถึงเรา</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block mb-2 font-medium text-zinc-300 text-sm">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
                      placeholder="กรอกชื่อ-นามสกุล"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 font-medium text-zinc-300 text-sm">
                      อีเมล *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
                      placeholder="กรอกอีเมล"
                    />
                  </div>
                </div>

                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className="block mb-2 font-medium text-zinc-300 text-sm">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
                      placeholder="กรอกเบอร์โทรศัพท์"
                    />
                  </div>
                  <div>
                    <label htmlFor="inquiryType" className="block mb-2 font-medium text-zinc-300 text-sm">
                      ประเภทคำถาม *
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      required
                      className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block mb-2 font-medium text-zinc-300 text-sm">
                    หัวข้อ *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
                    placeholder="กรอกหัวข้อ"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2 font-medium text-zinc-300 text-sm">
                    ข้อความ *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
                    placeholder="กรอกรายละเอียดข้อความ"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 px-6 py-3 rounded-lg w-full font-semibold text-white transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="border-white border-b-2 rounded-full w-5 h-5 animate-spin"></div>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      ส่งข้อความ
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="mb-6 font-bold text-white text-2xl text-center">แผนที่สำนักงาน</h2>
          <div className="bg-zinc-950 p-8 rounded-lg">
            <div className="flex justify-center items-center bg-zinc-700 rounded-lg aspect-video">
              <div className="text-center">
                <MapPinIcon className="mx-auto mb-4 w-16 h-16 text-zinc-500" />
                <p className="text-zinc-400">แผนที่ Google Maps</p>
                <p className="text-zinc-500 text-sm">(Map integration coming soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
