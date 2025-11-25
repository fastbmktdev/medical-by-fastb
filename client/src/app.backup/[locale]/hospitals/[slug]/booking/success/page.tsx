"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from '@/navigation';
import { createClient } from '@shared/lib/database/supabase/client';
import type { appointment } from '@shared/types';
import {
  CheckCircleIcon,
  CalendarIcon,
  MapPinIcon,
  CreditCardIcon,
  HomeIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Loading } from "@/components/design-system/primitives/Loading";

interface BookingWithHospital extends appointment {
  hospitals?: {
    hospital_name: string;
    slug: string;
  };
}

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payment_intent = searchParams.get("payment_intent");
  const bookingId = searchParams.get("appointment");
  const supabase = createClient();

  const [appointment, setBooking] = useState<appointment | null>(null);
  const [hospitalName, sethospitalName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      // Support both payment_intent (from Stripe) and appointment (direct)
      if (!payment_intent && !bookingId) {
        setError('ไม่พบข้อมูลการจอง');
        setIsLoading(false);
        return;
      }

      try {
        let bookingData: BookingWithHospital | null = null;

        // If payment_intent is provided, find appointment by payment_id
        if (payment_intent) {
          const { data, error: err } = await supabase
            .from('appointments')
            .select(`
              *,
              hospitals:hospital_id (
                hospital_name,
                slug
              )
            `)
            .eq('payment_id', payment_intent)
            .maybeSingle();
          
          if (!err && data) {
            bookingData = data as BookingWithHospital;
          }
        }
        
        // If appointment ID is provided, fetch directly
        if (!bookingData && bookingId) {
          const { data, error: err } = await supabase
            .from('appointments')
            .select(`
              *,
              hospitals:hospital_id (
                hospital_name,
                slug
              )
            `)
            .eq('id', bookingId)
            .maybeSingle();
          
          if (!err && data) {
            bookingData = data as BookingWithHospital;
          }
        }

        if (!bookingData) {
          console.error('appointment not found');
          setError('ไม่พบข้อมูลการจอง');
          setIsLoading(false);
          return;
        }

        setBooking(bookingData);
        const hospitals = Array.isArray(bookingData.hospitals) ? bookingData.hospitals[0] : bookingData.hospitals;
        sethospitalName(hospitals?.hospital_name || "");
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [payment_intent, bookingId, router, supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
        <div className="text-center space-y-4">
          <Loading centered size="xl" />
          <p className="text-zinc-300">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex justify-center items-center bg-zinc-100 p-4 min-h-screen">
        <div className="bg-zinc-100 shadow-xl p-8 border border-zinc-700  w-full max-w-md text-center">
          <div className="inline-flex justify-center items-center bg-brand-primary mb-4  w-16 h-16">
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2 font-bold text-2xl">
            ไม่พบข้อมูล
          </h1>
          <p className="mb-6 text-zinc-400">
            {error || 'ไม่พบข้อมูลการจอง'}
          </p>
          <Link
            href="/hospitals"
            className="inline-block bg-brand-primary hover:bg-red-600 px-6 py-3  font-semibold transition-colors"
          >
            กลับไปหน้าโรงพยาบาล
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-100 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="inline-flex justify-center items-center bg-green-600 mb-4  w-20 h-20">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="mb-2 font-bold text-3xl md:text-4xl">
            จองสำเร็จ!
          </h1>
          <p className="text-zinc-400 text-lg">
            เราได้รับการจองของคุณเรียบร้อยแล้ว
          </p>
        </div>

        {/* appointment Details Card */}
        <div className="bg-zinc-100 shadow-xl mb-6 p-8 border border-zinc-700 ">
          <div className="mb-6 pb-6 border-zinc-700 border-b">
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <p className="mb-1 text-zinc-400 text-sm">หมายเลขการจอง</p>
                <p className="font-mono font-bold text-2xl">
                  {appointment.booking_number}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-yellow-600/20 px-4 py-2 border border-yellow-600/50 ">
                <div className="bg-yellow-600  w-2 h-2"></div>
                <span className="font-semibold text-yellow-400 text-sm">
                  รอการยืนยัน
                </span>
              </div>
            </div>
          </div>

          {/* hospital Info */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <MapPinIcon className="shrink-0 mt-1 w-5 h-5 text-red-500" />
              <div>
                <p className="mb-1 text-zinc-400 text-sm">โรงพยาบาล</p>
                <p className="font-semibold text-xl">{hospitalName}</p>
              </div>
            </div>
          </div>

          {/* Package Info */}
          <div className="gap-6 grid sm:grid-cols-2 mb-6">
            <div className="bg-zinc-700/50 p-4 ">
              <p className="mb-2 text-zinc-400 text-xs uppercase tracking-wide">แพ็คเกจ</p>
              <p className="font-semibold text-white">{appointment.package_name}</p>
              {appointment.duration_months && (
                <p className="mt-1 text-zinc-400 text-sm">
                  ระยะเวลา {appointment.duration_months} เดือน
                </p>
              )}
            </div>

            <div className="bg-zinc-700/50 p-4 ">
              <p className="mb-2 text-zinc-400 text-xs uppercase tracking-wide">ราคา</p>
              <p className="font-bold text-red-500 text-2xl">
                ฿{appointment.price_paid.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="gap-6 grid sm:grid-cols-2 mb-6">
            <div className="flex items-start gap-3">
              <CalendarIcon className="shrink-0 mt-1 w-5 h-5 text-zinc-400" />
              <div>
                <p className="mb-1 text-zinc-400 text-xs uppercase tracking-wide">วันเริ่มต้น</p>
                <p className="font-semibold text-white">
                  {new Date(appointment.start_date).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {appointment.end_date && (
              <div className="flex items-start gap-3">
                <CalendarIcon className="shrink-0 mt-1 w-5 h-5 text-zinc-400" />
                <div>
                  <p className="mb-1 text-zinc-400 text-xs uppercase tracking-wide">วันสิ้นสุด</p>
                  <p className="font-semibold text-white">
                    {new Date(appointment.end_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="pt-6 border-zinc-700 border-t">
            <p className="mb-3 font-semibold text-white">ข้อมูลผู้จอง</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">ชื่อ:</span>
                <span className="font-medium text-white">{appointment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">อีเมล:</span>
                <span className="font-medium text-white">{appointment.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">เบอร์โทร:</span>
                <span className="font-medium text-white">{appointment.customer_phone}</span>
              </div>
            </div>
          </div>

          {appointment.special_requests && (
            <div className="mt-6 pt-6 border-zinc-700 border-t">
              <p className="mb-2 font-semibold text-white">คำขอพิเศษ</p>
              <p className="text-zinc-300 text-sm">{appointment.special_requests}</p>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="bg-yellow-600/10 mb-8 p-6 border border-yellow-600/30 ">
          <div className="flex items-start gap-3">
            <CreditCardIcon className="shrink-0 mt-1 w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="mb-2 font-semibold text-yellow-400 text-lg">
                ขั้นตอนต่อไป: การชำระเงิน
              </h3>
              <p className="mb-3 text-zinc-300 text-sm">
                เราได้ส่งรายละเอียดการชำระเงินไปยังอีเมลของคุณแล้ว 
                กรุณาชำระเงินภายใน 24 ชั่วโมง เพื่อยืนยันการจอง
              </p>
              <div className="space-y-2 text-zinc-300 text-sm">
                <p>• หมายเลขการจอง: <span className="font-mono font-semibold text-white">{appointment.booking_number}</span></p>
                <p>• จำนวนเงิน: <span className="font-semibold text-white">฿{appointment.price_paid.toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="gap-4 grid sm:grid-cols-2">
          <Link
            href="/dashboard/appointments"
            className="flex justify-center items-center gap-2 bg-brand-primary hover:bg-red-600 px-6 py-4  font-semibold transition-colors"
          >
            ดูรายการจองของฉัน
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="flex justify-center items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-4  font-semibold transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            กลับหน้าหลัก
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-zinc-400 text-sm">
            หากมีคำถามหรือต้องการความช่วยเหลือ{" "}
            <Link href="/contact" className="text-red-500 hover:text-red-400 underline">
              ติดต่อเรา
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
          <Loading centered size="xl" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
