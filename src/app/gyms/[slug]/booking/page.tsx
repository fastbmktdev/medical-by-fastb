"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Gym, GymPackage } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  HomeIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

// Booking Steps
const STEPS = [
  { id: 1, name: "เลือกแพ็คเกจ", icon: SparklesIcon },
  { id: 2, name: "ข้อมูลผู้จอง", icon: UserIcon },
  { id: 3, name: "ยืนยันและชำระเงิน", icon: CreditCardIcon },
];

interface BookingFormData {
  // Package selection
  packageType: "one_time" | "package" | "";
  selectedPackage: GymPackage | null;
  
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  
  // Dates
  startDate: string;
  
  // Special requests
  specialRequests: string;
  
  // Payment
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
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState<BookingFormData>({
    packageType: "",
    selectedPackage: null,
    fullName: "",
    email: "",
    phone: "",
    startDate: "",
    specialRequests: "",
    paymentMethod: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check authentication and load user profile
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
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

  // Fetch gym and packages data
  useEffect(() => {
    async function fetchData() {
      // Fetch gym
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (gymError || !gymData) {
        console.error('Error fetching gym:', gymError);
        setGym(null);
        setIsLoading(false);
        return;
      }

      setGym(gymData);

      // Fetch packages for this gym
      const { data: packagesData, error: packagesError } = await supabase
        .from('gym_packages')
        .select('*')
        .eq('gym_id', gymData.id)
        .eq('is_active', true)
        .order('package_type', { ascending: true })
        .order('duration_months', { ascending: true });

      if (!packagesError && packagesData) {
        setPackages(packagesData);
      }

      setIsLoading(false);
    }

    if (!isCheckingAuth) {
      fetchData();
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

  const oneTimePackages = packages.filter(p => p.package_type === 'one_time');
  const subscriptionPackages = packages.filter(p => p.package_type === 'package');

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.selectedPackage) {
        newErrors.package = "กรุณาเลือกแพ็คเกจ";
      }
    } else if (step === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
      if (!formData.email.trim()) newErrors.email = "กรุณากรอกอีเมล";
      if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
      if (!formData.startDate) newErrors.startDate = "กรุณาเลือกวันที่เริ่มต้น";
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
    if (!validateStep(currentStep) || !formData.selectedPackage) return;

    setIsSubmitting(true);
    try {
      // Create booking via API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gym_id: gym.id,
          package_id: formData.selectedPackage.id,
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          start_date: formData.startDate,
          special_requests: formData.specialRequests,
          payment_method: formData.paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการจอง');
      }

      // Redirect to success page
      router.push(`/gyms/${slug}/booking/success?booking=${result.data.id}`);
    } catch (error) {
      console.error("Error submitting booking:", error);
      setErrors({ 
        general: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectPackage = (pkg: GymPackage) => {
    setFormData((prev) => ({
      ...prev,
      selectedPackage: pkg,
      packageType: pkg.package_type,
    }));
    setErrors((prev) => ({ ...prev, package: "" }));
  };

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Header with Breadcrumb */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
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
            เลือกแพ็คเกจที่เหมาะกับคุณ
          </p>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-500/20 mb-6 p-4 border-2 border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Step 1: Package Selection */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 font-semibold text-white text-xl">เลือกประเภทการจอง</h2>
                
                {/* One-time Packages */}
                {oneTimePackages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-4 font-semibold text-zinc-300 text-lg">รายครั้ง</h3>
                    <div className="gap-4 grid md:grid-cols-2">
                      {oneTimePackages.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => selectPackage(pkg)}
                          className={`text-left bg-zinc-700 hover:bg-zinc-600 p-6 border-2 rounded-lg transition-all ${
                            formData.selectedPackage?.id === pkg.id
                              ? "border-red-500 ring-2 ring-red-500/50"
                              : "border-zinc-600"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="mb-1 font-bold text-white text-lg">{pkg.name}</h4>
                              {pkg.name_english && (
                                <p className="text-zinc-400 text-sm">{pkg.name_english}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-red-500 text-2xl">
                                ฿{pkg.price.toLocaleString()}
                              </div>
                              <div className="text-zinc-400 text-xs">ต่อครั้ง</div>
                            </div>
                          </div>
                          
                          {pkg.description && (
                            <p className="mb-4 text-zinc-300 text-sm">{pkg.description}</p>
                          )}
                          
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="space-y-2">
                              {pkg.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                                  <CheckIcon className="flex-shrink-0 w-4 h-4 text-green-500" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscription Packages */}
                {subscriptionPackages.length > 0 && (
                  <div>
                    <h3 className="mb-4 font-semibold text-zinc-300 text-lg">แพ็คเกจรายเดือน</h3>
                    <div className="gap-4 grid md:grid-cols-3">
                      {subscriptionPackages.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => selectPackage(pkg)}
                          className={`text-left bg-gradient-to-br from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 p-6 border-2 rounded-lg transition-all ${
                            formData.selectedPackage?.id === pkg.id
                              ? "border-red-500 ring-2 ring-red-500/50"
                              : "border-zinc-600"
                          }`}
                        >
                          <div className="mb-3 text-center">
                            <div className="inline-flex justify-center items-center bg-red-600 mb-2 px-3 py-1 rounded-full font-semibold text-white text-xs">
                              {pkg.duration_months} เดือน
                            </div>
                            <h4 className="mb-1 font-bold text-white text-lg">{pkg.name}</h4>
                            {pkg.name_english && (
                              <p className="text-zinc-400 text-xs">{pkg.name_english}</p>
                            )}
                          </div>
                          
                          <div className="mb-4 text-center">
                            <div className="font-bold text-red-500 text-3xl">
                              ฿{pkg.price.toLocaleString()}
                            </div>
                            <div className="text-zinc-400 text-xs">
                              (฿{Math.round(pkg.price / (pkg.duration_months || 1)).toLocaleString()}/เดือน)
                            </div>
                          </div>
                          
                          {pkg.description && (
                            <p className="mb-4 text-zinc-300 text-sm text-center">{pkg.description}</p>
                          )}
                          
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="space-y-2">
                              {pkg.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-zinc-300 text-xs">
                                  <CheckIcon className="flex-shrink-0 w-3 h-3 text-green-500" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {errors.package && (
                  <p className="mt-4 text-red-400 text-sm">{errors.package}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-white text-xl">ข้อมูลผู้จอง</h2>
              
              {/* Selected Package Summary */}
              {formData.selectedPackage && (
                <div className="bg-zinc-700/50 p-4 rounded-lg">
                  <p className="mb-2 font-semibold text-white">แพ็คเกจที่เลือก:</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white">{formData.selectedPackage.name}</p>
                      {formData.selectedPackage.duration_months && (
                        <p className="text-zinc-400 text-sm">
                          ระยะเวลา {formData.selectedPackage.duration_months} เดือน
                        </p>
                      )}
                    </div>
                    <div className="font-bold text-red-500 text-xl">
                      ฿{formData.selectedPackage.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                  วันที่เริ่มต้น <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`bg-zinc-700 px-4 py-3 border rounded-lg w-full text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none ${
                    errors.startDate ? "border-red-500" : "border-zinc-600"
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.startDate && (
                  <p className="mt-1 text-red-400 text-sm">{errors.startDate}</p>
                )}
                {formData.selectedPackage?.package_type === 'package' && formData.selectedPackage.duration_months && formData.startDate && (
                  <p className="mt-2 text-zinc-400 text-sm">
                    สิ้นสุด: {new Date(new Date(formData.startDate).setMonth(new Date(formData.startDate).getMonth() + formData.selectedPackage.duration_months)).toLocaleDateString('th-TH')}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-zinc-300 text-sm">
                  คำขอพิเศษ
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="bg-zinc-700 px-4 py-3 border border-zinc-600 focus:border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-500"
                  rows={4}
                  placeholder="มีความต้องการพิเศษอะไรเพิ่มเติมไหม?"
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-white text-xl">ยืนยันและชำระเงิน</h2>
              
              <div className="bg-zinc-700/50 p-6 rounded-lg">
                <h3 className="mb-4 font-semibold text-white">สรุปการจอง</h3>
                <div className="space-y-2 text-zinc-300 text-sm">
                  <div className="flex justify-between">
                    <span>ชื่อผู้จอง:</span>
                    <span className="font-semibold text-white">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>แพ็คเกจ:</span>
                    <span className="font-semibold text-white">{formData.selectedPackage?.name}</span>
                  </div>
                  {formData.selectedPackage?.duration_months && (
                    <div className="flex justify-between">
                      <span>ระยะเวลา:</span>
                      <span className="font-semibold text-white">
                        {formData.selectedPackage.duration_months} เดือน
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>วันที่เริ่มต้น:</span>
                    <span className="font-semibold text-white">
                      {new Date(formData.startDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-zinc-600 border-t">
                    <span className="font-semibold text-lg">ยอดรวม:</span>
                    <span className="font-bold text-red-500 text-2xl">
                      ฿{formData.selectedPackage?.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-3 font-medium text-white text-sm">
                  วิธีการชำระเงิน
                </label>
                <div className="space-y-3">
                  {[
                    { value: "transfer", label: "โอนเงินผ่านธนาคาร" },
                    { value: "promptpay", label: "พร้อมเพย์" },
                    { value: "credit", label: "บัตรเครดิต/เดบิต" },
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
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-white">{method.label}</span>
                    </label>
                  ))}
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
                disabled={isSubmitting || !formData.paymentMethod}
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

