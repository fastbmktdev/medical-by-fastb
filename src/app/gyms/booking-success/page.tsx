'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GymBookingSuccessPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
            <svg
              className="h-12 w-12 text-green-600"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            จองสำเร็จ!
          </h1>
          <p className="text-gray-600">
            ขอบคุณที่เลือกใช้บริการของเรา
          </p>
        </div>

        {/* Booking Details */}
        {orderNumber && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">รายละเอียดการจอง</h2>
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
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">ยอดรวม:</span>
                    <span className="text-green-600 font-bold">
                      ฿{booking.totalPrice?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">ขั้นตอนถัดไป</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>เราได้ส่งอีเมลยืนยันการจองไปให้คุณแล้ว</li>
            <li>คุณสามารถดูรายละเอียดการจองได้ที่หน้า "การจองของฉัน"</li>
            <li>กรุณานำเลขที่การจองมาแสดงเมื่อเช็คอิน</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/bookings"
            className="flex-1 bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ดูการจองของฉัน
          </Link>
          <Link
            href="/gyms"
            className="flex-1 bg-white border border-gray-300 text-gray-700 text-center px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            กลับไปหน้าค่ายมวย
          </Link>
        </div>
      </div>
    </div>
  );
}
