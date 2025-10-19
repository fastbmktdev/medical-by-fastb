'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/gym/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-50 min-h-screen">
        <div className="border-blue-600 border-b-2 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-gray-50 p-4 min-h-screen">
      <div className="bg-white shadow-lg p-8 rounded-lg w-full max-w-2xl">
        {/* Success Icon */}
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center bg-green-100 mx-auto mb-4 rounded-full w-20 h-20">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 font-bold text-gray-900 text-3xl">
            จองสำเร็จ!
          </h1>
          <p className="text-gray-600">
            ขอบคุณที่เลือกใช้บริการของเรา
          </p>
        </div>

        {/* Booking Details */}
        {orderNumber && (
          <div className="bg-gray-50 mb-6 p-6 rounded-lg">
            <h2 className="mb-4 font-semibold text-lg">รายละเอียดการจอง</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">เลขที่การจอง:</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
              {booking && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ค่ายมวย:</span>
                    <span className="font-medium">{booking.gymName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันที่เข้าพัก:</span>
                    <span className="font-medium">
                      {new Date(booking.startDate).toLocaleDateString('th-TH')} -{' '}
                      {new Date(booking.endDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">แพ็กเกจ:</span>
                    <span className="font-medium">{booking.packageName}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-gray-200 border-t">
                    <span className="font-semibold text-gray-900">ยอดรวม:</span>
                    <span className="font-bold text-green-600">
                      ฿{booking.totalPrice?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 mb-6 p-6 border border-blue-200 rounded-lg">
          <h3 className="mb-2 font-semibold text-blue-900">ขั้นตอนถัดไป</h3>
          <ul className="space-y-1 text-blue-800 text-sm list-disc list-inside">
            <li>เราได้ส่งอีเมลยืนยันการจองไปให้คุณแล้ว</li>
            <li>คุณสามารถดูรายละเอียดการจองได้ที่หน้า "การจองของฉัน"</li>
            <li>กรุณานำเลขที่การจองมาแสดงเมื่อเช็คอิน</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex sm:flex-row flex-col gap-3">
          <Link
            href="/dashboard/bookings"
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white text-center transition-colors"
          >
            ดูการจองของฉัน
          </Link>
          <Link
            href="/gyms"
            className="flex-1 bg-white hover:bg-gray-50 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 text-center transition-colors"
          >
            กลับไปหน้าค่ายมวย
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GymBookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-gray-50 min-h-screen">
          <div className="border-blue-600 border-b-2 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
