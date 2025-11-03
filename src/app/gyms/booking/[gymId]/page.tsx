'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PaymentWrapper } from '@/components/features/payments';
import { createClient } from '@/lib/database/supabase/client';

interface BookingStep {
  id: number;
  title: string;
  description: string;
}

const BOOKING_STEPS: BookingStep[] = [
  {
    id: 1,
    title: 'เลือกวันที่',
    description: 'เลือกวันที่เริ่มต้นและสิ้นสุดการเข้าพัก',
  },
  {
    id: 2,
    title: 'เลือกแพ็กเกจ',
    description: 'เลือกแพ็กเกจที่เหมาะสมกับคุณ',
  },
  {
    id: 3,
    title: 'ข้อมูลติดต่อ',
    description: 'กรอกข้อมูลสำหรับการติดต่อ',
  },
  {
    id: 4,
    title: 'ชำระเงิน',
    description: 'ชำระเงินเพื่อยืนยันการจอง',
  },
];

interface Package {
  id: string;
  name: string;
  nameEn: string;
  type: 'daily' | 'weekly' | 'monthly';
  price: number;
  duration: number;
  description: string;
}

const PACKAGES: Package[] = [
  {
    id: 'daily',
    name: 'รายวัน',
    nameEn: 'Daily',
    type: 'daily',
    price: 500,
    duration: 1,
    description: 'เหมาะสำหรับผู้ที่ต้องการทดลองฝึก',
  },
  {
    id: 'weekly',
    name: 'รายสัปดาห์',
    nameEn: 'Weekly',
    type: 'weekly',
    price: 3000,
    duration: 7,
    description: 'ประหยัดกว่ารายวัน 14%',
  },
  {
    id: 'monthly',
    name: 'รายเดือน',
    nameEn: 'Monthly',
    type: 'monthly',
    price: 10000,
    duration: 30,
    description: 'คุ้มค่าที่สุด ประหยัดกว่ารายวัน 33%',
  },
];

export default function GymBookingPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.gymId as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [gymData, setGymData] = useState<{ id: string; gym_name: string; [key: string]: unknown } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Form data
  const [startDate, setStartDate] = useState(getTomorrowDate());
  const [endDate, setEndDate] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Payment data
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const fetchGymData = useCallback(async () => {
    try {
      const response = await fetch(`/api/gyms/${gymId}`);
      if (!response.ok) throw new Error('Failed to fetch gym data');
      const data = await response.json();
      setGymData(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลค่ายมวยได้');
      // Error occurred
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  const loadUserProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load user profile data from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Pre-fill user data from profile and metadata
        const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.display_name || "";
        const email = user.email || "";
        const phone = profile?.phone || user.user_metadata?.phone || "";
        
        setContactInfo({
          name: fullName,
          email: email,
          phone: phone,
          notes: '',
        });
      }
    } catch (err) {
      // Error loading user profile
    }
  };

  useEffect(() => {
    fetchGymData();
    loadUserProfile();
  }, [gymId, fetchGymData]);

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!startDate || !endDate) {
        alert('กรุณาเลือกวันที่');
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        alert('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น');
        return;
      }
    }

    if (currentStep === 2) {
      if (!selectedPackage) {
        alert('กรุณาเลือกแพ็กเกจ');
        return;
      }
    }

    if (currentStep === 3) {
      if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      // Move to payment step
      await createPaymentIntent();
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const createPaymentIntent = async () => {
    if (!selectedPackage) return;

    try {
      const duration = calculateDuration(startDate, endDate);
      const totalAmount = selectedPackage.price;

      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          paymentType: 'gym_booking',
          metadata: {
            gymId,
            gymName: gymData?.name || 'Gym',
            startDate,
            endDate,
            packageType: selectedPackage.type,
            packageName: selectedPackage.name,
            duration,
            userName: contactInfo.name,
            userPhone: contactInfo.phone,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);

      // Create gym booking record
      await createGymBooking(data.orderId, totalAmount, duration);
    } catch (err) {
      setError('ไม่สามารถเริ่มการชำระเงินได้');
      // Error occurred
    }
  };

  const createGymBooking = async (orderId: string, totalAmount: number, duration: number) => {
    if (!selectedPackage) return;

    try {
      await fetch('/api/bookings/gym', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          gymId,
          startDate,
          endDate,
          durationDays: duration,
          packageType: selectedPackage.type,
          packageName: selectedPackage.name,
          packageNameEn: selectedPackage.nameEn,
          unitPrice: selectedPackage.price,
          totalPrice: totalAmount,
          notes: contactInfo.notes,
        }),
      });
    } catch (err) {
      // Error creating gym booking
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    router.push(`/gyms/booking-success?orderId=${orderId}&orderNumber=${orderNumber}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-50 min-h-screen">
        <div className="text-center">
          <div className="mx-auto border-blue-600 border-b-2 rounded-full w-12 h-12 animate-spin"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="flex justify-center items-center bg-gray-50 p-4 min-h-screen">
        <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-md">
          <div className="text-center">
            <div className="mb-4 text-red-600 text-5xl">⚠️</div>
            <h1 className="mb-2 font-bold text-gray-900 text-2xl">
              เกิดข้อผิดพลาด
            </h1>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
            >
              กลับไปหน้าก่อนหน้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="mx-auto max-w-4xl">
        {/* Progress Bar */}
        <div className="bg-white shadow-lg mb-6 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            {BOOKING_STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col flex-1 items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        currentStep >= step.id
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="hidden sm:block text-gray-500 text-xs">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < BOOKING_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow-lg p-6 md:p-8 rounded-lg">
          {/* Gym Info Header */}
          {gymData && (
            <div className="mb-6 pb-6 border-gray-200 border-b">
              <h1 className="font-bold text-gray-900 text-2xl">
                {typeof gymData.gym_name === 'string' ? gymData.gym_name : 'Unknown Gym'}
              </h1>
              <p className="text-gray-600">{typeof gymData.location === 'string' ? gymData.location : ''}</p>
            </div>
          )}

          {/* Step 1: Date Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-xl">เลือกวันที่เข้าพัก</h2>
              <div className="gap-4 grid md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getTomorrowDate()}
                    className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-900">
                    ระยะเวลาการเข้าพัก: {calculateDuration(startDate, endDate)} วัน
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Package Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-xl">เลือกแพ็กเกจ</h2>
              <div className="gap-4 grid md:grid-cols-3">
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`cursor-pointer border rounded-lg p-6 transition-all ${
                      selectedPackage?.id === pkg.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {pkg.name}
                      </h3>
                      <div className="my-4 font-bold text-blue-600 text-3xl">
                        ฿{pkg.price.toLocaleString()}
                      </div>
                      <p className="text-gray-600 text-sm">{pkg.description}</p>
                      <div className="mt-4 text-gray-500 text-xs">
                        {pkg.duration} วัน
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-xl">ข้อมูลติดต่อ</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, name: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    อีเมล *
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, phone: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    หมายเหตุ (ถ้ามี)
                  </label>
                  <textarea
                    value={contactInfo.notes}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, notes: e.target.value })
                    }
                    rows={3}
                    className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-xl">ชำระเงิน</h2>

              {/* Booking Summary */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">เลขที่การจอง:</span>
                  <span className="font-medium">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ค่ายมวย:</span>
                  <span className="font-medium">{typeof gymData?.gym_name === 'string' ? gymData.gym_name : 'Unknown Gym'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่เข้าพัก:</span>
                  <span className="font-medium">
                    {new Date(startDate).toLocaleDateString('th-TH')} -{' '}
                    {new Date(endDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">แพ็กเกจ:</span>
                  <span className="font-medium">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between pt-2 border-gray-200 border-t">
                  <span className="font-semibold text-gray-900">ยอดรวม:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ฿{selectedPackage?.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              {clientSecret && (
                <PaymentWrapper
                  clientSecret={clientSecret}
                  returnUrl={`${process.env.NEXT_PUBLIC_APP_URL}/gyms/booking-success?orderId=${orderId}&orderNumber=${orderNumber}`}
                  userPhone={contactInfo.phone}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {error && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                className="hover:bg-gray-50 disabled:opacity-50 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 transition-colors disabled:cursor-not-allowed"
               aria-label="Button">
                ย้อนกลับ
              </button>
              <button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
               aria-label="Button">
                {currentStep === 3 ? 'ไปที่หน้าชำระเงิน' : 'ถัดไป'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
