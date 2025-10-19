"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/database/supabase/client";
import type { Gym } from "@/types";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  HomeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

// Booking Steps
const STEPS = [
  { id: 1, name: "ข้อมูลผู้จอง", icon: UserIcon },
  { id: 2, name: "เลือกวันที่", icon: CalendarIcon },
  { id: 3, name: "แพ็คเกจและบริการ", icon: ClockIcon },
  { id: 4, name: "ชำระเงิน", icon: CreditCardIcon },
];

interface BookingFormData {
  // Step 1: Personal Info
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  
  // Step 2: Dates
  checkInDate: string;
  checkOutDate: string;
  
  // Step 3: Package
  packageType: string;
  selectedServices: string[];
  specialRequests: string;
  
  // Step 4: Payment
  paymentMethod: string;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [gym, setGym] = useState<Gym | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState<BookingFormData>({
    fullName: "",
    email: "",
    phone: "",
    nationality: "ไทย",
    checkInDate: "",
    checkOutDate: "",
    packageType: "",
    selectedServices: [],
    specialRequests: "",
    paymentMethod: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check authentication and load user profile
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(`/gyms/${slug}/booking`);
        router.push(`/login?redirect=${returnUrl}`);
        return;
      }

      setUser(user);
      
      // Load user profile data from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Pre-fill user data from profile and metadata
      const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.display_name || "";
      const phone = profile?.phone || user.user_metadata?.phone || "";
      
      setFormData((prev) => ({
        ...prev,
        fullName: fullName,
        email: user.email || "",
        phone: phone,
      }));
      
      setIsCheckingAuth(false);
    }

    checkAuth();
  }, [slug, router, supabase]);

  // Fetch gym data
  useEffect(() => {
    async function fetchGym() {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) {
        console.error('Error fetching gym:', error);
      }

      setGym(data);
      setIsLoading(false);
    }

    if (!isCheckingAuth) {
      fetchGym();
    }
  }, [slug, supabase, isCheckingAuth]);

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-900 min-h-screen">
        <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!gym) {
    notFound();
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
      if (!formData.email.trim()) newErrors.email = "กรุณากรอกอีเมล";
      if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (step === 2) {
      if (!formData.checkInDate) newErrors.checkInDate = "กรุณาเลือกวันเข้าพัก";
      if (!formData.checkOutDate) newErrors.checkOutDate = "กรุณาเลือกวันออก";
    } else if (step === 3) {
      if (!formData.packageType) newErrors.packageType = "กรุณาเลือกแพ็คเกจ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // TODO: Submit booking to API
      console.log("Booking data:", {
        ...formData,
        userId: user?.id,
        gymSlug: slug,
      });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Redirect to success page
      router.push(`/gyms/${slug}/booking/success`);
    } catch (error) {
      console.error("Error submitting booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof BookingFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Header with Breadcrumb */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-3 text-sm">
            <Link href="/" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
              <HomeIcon className="w-4 h-4" />
              <span>หน้าแรก</span>
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
            <Link href="/gyms" className="text-zinc-400 hover:text-white transition-colors">
              ค่ายมวย
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
            <Link href={`/gyms/${slug}`} className="text-zinc-400 hover:text-white transition-colors">
              {gym.gym_name}
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
            <span className="font-medium text-white">จองค่ายมวย</span>
          </nav>

          {/* Back Button */}
          <Link
            href={`/gyms/${slug}`}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>กลับไปหน้ารายละเอียด</span>
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-zinc-800/50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col flex-1 items-center">
                    <div
                      className={`flex justify-center items-center rounded-full w-12 h-12 transition-all ${
                        isCompleted
                          ? "bg-green-600"
                          : isCurrent
                          ? "bg-red-600"
                          : "bg-zinc-700"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-center text-sm ${
                        isCurrent ? "text-white font-semibold" : "text-zinc-400"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? "bg-green-600" : "bg-zinc-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <div className="bg-zinc-800 shadow-xl p-8 border border-zinc-700 rounded-xl">
          <h1 className="mb-2 font-bold text-white text-3xl">
            จอง {gym.gym_name}
          </h1>
          <p className="mb-8 text-zinc-400">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อดำเนินการจอง
          </p>

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-white text-xl">ข้อมูลผู้จอง</h2>
              
              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData("fullName", e.target.value)}
                  className={`bg-zinc-700 px-4 py-3 border rounded-lg w-full text-white placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
                    errors.fullName ? "border-red-500" : "border-zinc-600"
                  }`}
                  placeholder="เช่น: สมชาย ใจดี"
                />
                {errors.fullName && (
                  <p className="mt-1 text-red-400 text-sm">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className={`bg-zinc-700 px-4 py-3 border rounded-lg w-full text-white placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
                    errors.email ? "border-red-500" : "border-zinc-600"
                  }`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-red-400 text-sm">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className={`bg-zinc-700 px-4 py-3 border rounded-lg w-full text-white placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
                    errors.phone ? "border-red-500" : "border-zinc-600"
                  }`}
                  placeholder="0812345678"
                />
                {errors.phone && (
                  <p className="mt-1 text-red-400 text-sm">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  สัญชาติ
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => updateFormData("nationality", e.target.value)}
                  className="bg-zinc-700 px-4 py-3 border border-zinc-600 focus:border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-500"
                  placeholder="ไทย"
                />
              </div>
            </div>
          )}

          {/* Step 2: Dates */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-white text-xl">เลือกวันที่</h2>
              
              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  วันเริ่มต้น <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => updateFormData("checkInDate", e.target.value)}
                  className={`bg-zinc-700 px-4 py-3 border rounded-lg w-full text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
                    errors.checkInDate ? "border-red-500" : "border-zinc-600"
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.checkInDate && (
                  <p className="mt-1 text-red-400 text-sm">{errors.checkInDate}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  วันสิ้นสุด <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => updateFormData("checkOutDate", e.target.value)}
                  className={`bg-zinc-700 px-4 py-3 border rounded-lg w-full text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
                    errors.checkOutDate ? "border-red-500" : "border-zinc-600"
                  }`}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                />
                {errors.checkOutDate && (
                  <p className="mt-1 text-red-400 text-sm">{errors.checkOutDate}</p>
                )}
              </div>

              {formData.checkInDate && formData.checkOutDate && (
                <div className="bg-zinc-700/50 p-4 rounded-lg">
                  <p className="text-zinc-300 text-sm">
                    ระยะเวลา: {Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} วัน
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Package */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-white text-xl">เลือกแพ็คเกจและบริการ</h2>
              
              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  แพ็คเกจ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {["พื้นฐาน", "มาตรฐาน", "พรีเมียม"].map((pkg) => (
                    <label
                      key={pkg}
                      className={`block bg-zinc-700 hover:bg-zinc-600 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.packageType === pkg
                          ? "border-red-500 bg-zinc-600"
                          : "border-zinc-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={pkg}
                        checked={formData.packageType === pkg}
                        onChange={(e) => updateFormData("packageType", e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-semibold text-white">{pkg}</span>
                    </label>
                  ))}
                </div>
                {errors.packageType && (
                  <p className="mt-1 text-red-400 text-sm">{errors.packageType}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  บริการเพิ่มเติม
                </label>
                <div className="space-y-2">
                  {gym.services.map((service) => (
                    <label key={service} className="flex items-center text-zinc-300">
                      <input
                        type="checkbox"
                        checked={formData.selectedServices.includes(service)}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...formData.selectedServices, service]
                            : formData.selectedServices.filter((s) => s !== service);
                          updateFormData("selectedServices", newServices);
                        }}
                        className="mr-2"
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  คำขอพิเศษ
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => updateFormData("specialRequests", e.target.value)}
                  className="bg-zinc-700 px-4 py-3 border border-zinc-600 focus:border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-500"
                  rows={4}
                  placeholder="มีความต้องการพิเศษอะไรเพิ่มเติมไหม?"
                />
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-white text-xl">วิธีการชำระเงิน</h2>
              
              <div className="space-y-3">
                {[
                  { value: "transfer", label: "โอนเงินผ่านธนาคาร" },
                  { value: "promptpay", label: "พร้อมเพย์" },
                  { value: "credit", label: "บัตรเครดิต/เดบิต" },
                  { value: "onsite", label: "ชำระเงินที่ค่ายมวย" },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`block bg-zinc-700 hover:bg-zinc-600 p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === method.value
                        ? "border-red-500 bg-zinc-600"
                        : "border-zinc-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={(e) => updateFormData("paymentMethod", e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-white">{method.label}</span>
                  </label>
                ))}
              </div>

              <div className="bg-zinc-700/50 p-6 rounded-lg">
                <h3 className="mb-4 font-semibold text-white">สรุปการจอง</h3>
                <div className="space-y-2 text-zinc-300 text-sm">
                  <div className="flex justify-between">
                    <span>ชื่อผู้จอง:</span>
                    <span className="font-semibold text-white">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันที่:</span>
                    <span className="font-semibold text-white">
                      {formData.checkInDate} ถึง {formData.checkOutDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>แพ็คเกจ:</span>
                    <span className="font-semibold text-white">{formData.packageType}</span>
                  </div>
                  {formData.selectedServices.length > 0 && (
                    <div className="flex justify-between">
                      <span>บริการเพิ่มเติม:</span>
                      <span className="font-semibold text-white">
                        {formData.selectedServices.length} รายการ
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4 mt-8 pt-6 border-zinc-700 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-zinc-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            >
              ย้อนกลับ
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold text-white transition-colors"
              >
                ถัดไป
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-8 py-3 rounded-lg font-semibold text-white transition-colors disabled:cursor-not-allowed"
              >
                {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการจอง"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

