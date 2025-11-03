"use client";

import { useState } from "react";
import { 
  PaperAirplaneIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";
import { Button, BaseInput, ErrorDisplay } from "@/components/shared";

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  className?: string;
}

export function ContactForm({ onSubmit, className }: ContactFormProps = {}) {
  const [formData, setFormData] = useState<ContactFormData>({
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
      if (onSubmit) {
        // Use custom submit handler
        await onSubmit(formData);
        setSubmitStatus({
          type: 'success',
          message: 'ส่งข้อความสำเร็จ! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง',
        });
      } else {
        // Default API submission
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          setSubmitStatus({
            type: 'success',
            message: data.message || 'ส่งข้อความสำเร็จ! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง',
          });
        } else {
          setSubmitStatus({
            type: 'error',
            message: data.error || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
          });
        }
      }
      
      // Clear form on success
      if (submitStatus.type !== 'error') {
        setFormData({
          name: "",
          email: "",
          message: "",
        });

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: '' });
        }, 5000);
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
    <form onSubmit={handleSubmit} className={`space-y-4 mx-auto max-w-md ${className || ''}`}>
      {/* Status Message */}
      {submitStatus.type && (
        <ErrorDisplay
          variant={submitStatus.type === 'success' ? 'card' : 'card'}
          error={submitStatus.message}
          className={submitStatus.type === 'success' 
            ? 'bg-green-500/20 border-green-500 text-green-400' 
            : undefined
          }
        />
      )}

      <BaseInput
        name="name"
        label="ชื่อ (Name)"
        type="text"
        value={formData.name}
        onChange={(value) => {
          if (typeof value === 'string') {
            setFormData(prev => ({ ...prev, name: value }));
          }
        }}
        required
        placeholder="กรอกชื่อของคุณ"
        disabled={isSubmitting}
      />

      <BaseInput
        name="email"
        label="อีเมล (Email)"
        type="email"
        value={formData.email}
        onChange={(value) => {
          if (typeof value === 'string') {
            setFormData(prev => ({ ...prev, email: value }));
          }
        }}
        required
        placeholder="your@email.com"
        disabled={isSubmitting}
      />

      <div>
        <label
          htmlFor="message"
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          ข้อความ (Message) <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={4}
          disabled={isSubmitting}
          className="bg-zinc-700 px-4 py-3 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-text-primary resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="เขียนข้อความของคุณที่นี่..."
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="กำลังส่ง..."
        leftIcon={<PaperAirplaneIcon className="w-5 h-5" />}
        fullWidth
        size="lg"
      >
        ส่งข้อความ
      </Button>
    </form>
  );
}
