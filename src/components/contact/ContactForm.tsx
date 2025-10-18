"use client";

import { useState } from "react";
import { 
  PaperAirplaneIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear status when user starts typing
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Send to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Success
        setSubmitStatus({
          type: 'success',
          message: data.message || 'ส่งข้อความสำเร็จ! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง',
        });
        
        // Clear form
        setFormData({
          name: "",
          email: "",
          message: "",
        });

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: '' });
        }, 5000);
      } else {
        // Error
        setSubmitStatus({
          type: 'error',
          message: data.error || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mx-auto max-w-md">
      {/* Status Message */}
      {submitStatus.type && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            submitStatus.type === 'success'
              ? 'bg-green-500/20 border border-green-500 text-green-400'
              : 'bg-red-500/20 border border-red-500 text-red-400'
          }`}
        >
          {submitStatus.type === 'success' ? (
            <CheckCircleIcon className="flex-shrink-0 w-6 h-6" />
          ) : (
            <ExclamationTriangleIcon className="flex-shrink-0 w-6 h-6" />
          )}
          <p className="text-sm">{submitStatus.message}</p>
        </div>
      )}

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

