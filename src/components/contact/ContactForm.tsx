"use client";

import { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    alert("ส่งข้อความเรียบร้อยแล้ว! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง");
    setFormData({
      name: "",
      email: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mx-auto max-w-md">
      <div>
        <label
          htmlFor="name"
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          ชื่อ (Name)
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
          placeholder="กรอกชื่อของคุณ"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          อีเมล (Email)
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          ข้อความ (Message)
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={4}
          className="bg-zinc-700 px-3 py-2 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white resize-none"
          placeholder="เขียนข้อความของคุณที่นี่..."
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
  );
}

