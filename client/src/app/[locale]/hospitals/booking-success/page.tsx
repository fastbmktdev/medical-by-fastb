'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import { createClient } from '@shared/lib/database/supabase/client';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface BookingDetails {
  id: string;
  booking_number: string;
  package_name: string;
  start_date: string;
  end_date: string | null;
  price_paid: number;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  hospital_name: string;
  hospital_slug: string;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const payment_intent = searchParams.get('payment_intent');
  const redirect_status = searchParams.get('redirect_status');
  
  const supabase = createClient();
  const [appointment, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'succeeded' | 'failed'>('verifying');

  useEffect(() => {
    async function verifyPaymentAndFetchBooking() {
      // Check if we have payment intent
      if (!payment_intent) {
        setError('ไม่พบข้อมูลการชำระเงิน');
        setLoading(false);
        return;
      }

      try {
        // Check redirect status from Stripe
        if (redirect_status === 'failed') {
          setPaymentStatus('failed');
          setError('การชำระเงินล้มเหลว');
          setLoading(false);
          return;
        }

        // Verify payment in database
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('id, status, payment_type, metadata, user_id')
          .eq('stripe_payment_intent_id', payment_intent)
          .single();

        if (paymentError || !paymentData) {
          console.error('Payment not found:', paymentError);
          setError('ไม่พบข้อมูลการชำระเงินในระบบ กรุณารอสักครู่แล้วลองใหม่');
          setLoading(false);
          return;
        }

        // Check payment status
        if (paymentData.status === 'pending') {
          setPaymentStatus('verifying');
          setError('กำลังตรวจสอบการชำระเงิน กรุณารอสักครู่...');
        } else if (paymentData.status === 'succeeded') {
          setPaymentStatus('succeeded');
          
          // Get order from payment
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('payment_id', paymentData.id)
            .single();

          if (orderError || !orderData) {
            setError('ไม่พบข้อมูลคำสั่งซื้อ');
            setLoading(false);
            return;
          }

          // Get appointment details from appointments table (using payment_id which stores stripe payment intent id)
          const { data: bookingData, error: bookingError } = await supabase
            .from('appointments')
            .select(`
              id,
              booking_number,
              package_name,
              start_date,
              end_date,
              price_paid,
              status,
              payment_status,
              customer_name,
              customer_email,
              customer_phone,
              hospitals:hospital_id (
                hospital_name,
                slug
              )
            `)
            .eq('payment_id', payment_intent)
            .maybeSingle();

          if (!bookingError && bookingData) {
            const hospitals = Array.isArray(bookingData.hospitals) ? bookingData.hospitals[0] : bookingData.hospitals;
            
            // Track appointment completion with actual appointment data
            try {
              const { trackBookingCompletion, trackPaymentSuccess } = await import('@shared/lib/utils/analytics');
              if (bookingData.price_paid && hospitals) {
                trackPaymentSuccess(paymentData.id, bookingData.price_paid, bookingData.id);
                // Get hospital_id from the relation
                const hospitalId = (typeof hospitals === 'object' && hospitals !== null && 'id' in hospitals) 
                  ? String((hospitals as { id: string }).id) 
                  : paymentData.metadata?.hospitalId || '';
                const packageId = paymentData.metadata?.packageId || '';
                trackBookingCompletion(
                  bookingData.id,
                  hospitalId,
                  packageId,
                  bookingData.price_paid
                );
              }
            } catch (error) {
              console.warn('Analytics tracking error:', error);
            }
            
            const normalized: BookingDetails = {
              id: bookingData.id,
              booking_number: bookingData.booking_number,
              package_name: bookingData.package_name,
              start_date: bookingData.start_date,
              end_date: bookingData.end_date,
              price_paid: Number(bookingData.price_paid),
              status: bookingData.status,
              payment_status: bookingData.payment_status,
              customer_name: bookingData.customer_name,
              customer_email: bookingData.customer_email,
              customer_phone: bookingData.customer_phone,
              hospital_name: hospitals?.hospital_name || '',
              hospital_slug: hospitals?.slug || '',
            };
            setBooking(normalized);
          } else {
            setError('ไม่พบข้อมูลการจอง');
          }
        } else {
          setPaymentStatus('failed');
          setError('การชำระเงินไม่สำเร็จ');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
      } finally {
        setLoading(false);
      }
    }

    verifyPaymentAndFetchBooking();
  }, [payment_intent, redirect_status, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-red-600 border-t-transparent  w-16 h-16 animate-spin"></div>
          <p className="text-zinc-300 text-lg">กำลังตรวจสอบการชำระเงิน...</p>
        </div>
      </div>
    );
  }

  // Payment Failed
  if (paymentStatus === 'failed' || error) {
    return (
      <div className="flex justify-center items-center bg-zinc-100 p-4 min-h-screen">
        <div className="bg-zinc-100 shadow-xl p-8 border border-zinc-700  w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex justify-center items-center bg-brand-primary mb-4  w-20 h-20">
              <XCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="mb-2 font-bold text-3xl">
              การชำระเงินไม่สำเร็จ
            </h1>
            <p className="text-zinc-400 text-lg">
              {error || 'เกิดข้อผิดพลาดในการชำระเงิน'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/hospitals"
              className="flex-1 bg-brand-primary hover:bg-red-600 px-6 py-3  font-semibold text-center transition-colors"
            >
              กลับไปหน้าโรงพยาบาล
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment is still pending/verifying
  if (paymentStatus === 'verifying') {
    return (
      <div className="flex justify-center items-center bg-zinc-100 p-4 min-h-screen">
        <div className="bg-zinc-100 shadow-xl p-8 border border-zinc-700  w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex justify-center items-center bg-yellow-600 mb-4  w-20 h-20">
              <ClockIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="mb-2 font-bold text-3xl">
              กำลังตรวจสอบการชำระเงิน
            </h1>
            <p className="text-zinc-400 text-lg">
              กรุณารอสักครู่ เรากำลังยืนยันการชำระเงินของคุณ
            </p>
          </div>
          <div className="bg-yellow-600/10 p-4 border border-yellow-600/30 ">
            <p className="text-yellow-400 text-sm text-center">
              หน้านี้จะอัปเดตอัตโนมัติเมื่อการชำระเงินสำเร็จ
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Payment Succeeded - Show success page
  return (
    <div className="flex justify-center items-center bg-zinc-100 p-4 min-h-screen">
      <div className="bg-zinc-100 shadow-xl p-8 border border-zinc-700  w-full max-w-2xl">
        {/* Success Icon */}
        <div className="mb-8 text-center">
          <div className="inline-flex justify-center items-center bg-green-600 mb-4  w-20 h-20">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="mb-2 font-bold text-3xl md:text-4xl">
            จองสำเร็จ!
          </h1>
          <p className="text-zinc-400 text-lg">
            การชำระเงินและการจองเสร็จสมบูรณ์แล้ว
          </p>
        </div>

        {/* appointment Details */}
        {appointment && (
          <div className="bg-zinc-100/50 mb-6 p-6 border border-zinc-600 ">
            <h2 className="mb-4 font-semibold text-lg">รายละเอียดการจอง</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">เลขที่การจอง:</span>
                <span className="font-mono font-medium text-white">{appointment.booking_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">โรงพยาบาล:</span>
                <span className="font-medium text-white">{appointment.hospital_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">แพ็กเกจ:</span>
                <span className="font-medium text-white">{appointment.package_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">วันที่เริ่มต้น:</span>
                <span className="font-medium text-white">
                  {new Date(appointment.start_date).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {appointment.end_date && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">วันที่สิ้นสุด:</span>
                  <span className="font-medium text-white">
                    {new Date(appointment.end_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">ชื่อผู้จอง:</span>
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
              <div className="flex justify-between items-center pt-3 border-zinc-600 border-t">
                <span className="font-semibold text-lg">ยอดรวม:</span>
                <span className="font-bold text-green-400 text-2xl">
                  ฿{Number(appointment.price_paid).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">สถานะการชำระ:</span>
                <span className="inline-flex items-center gap-2 bg-green-600/20 px-3 py-1 border border-green-600/50 ">
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-green-400 text-sm">ชำระเงินแล้ว</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-600/10 mb-6 p-6 border border-blue-600/30 ">
          <h3 className="flex items-center gap-2 mb-3 font-semibold text-blue-400">
            <ExclamationTriangleIcon className="w-5 h-5" />
            ขั้นตอนถัดไป
          </h3>
          <ul className="space-y-2 text-zinc-300 text-sm list-disc list-inside">
            <li>เราได้ส่งอีเมลยืนยันการจองไปที่ <strong className="text-white">{appointment?.customer_email}</strong> แล้ว</li>
            <li>{`คุณสามารถดูรายละเอียดการจองได้ที่หน้า "การจองของฉัน"`}</li>
            <li>กรุณานำหมายเลขการจอง <strong className="font-mono text-white">{appointment?.booking_number}</strong> มาแสดงเมื่อเช็คอิน</li>
            <li>โรงพยาบาลจะติดต่อกลับเพื่อยืนยันการจองภายใน 24 ชั่วโมง</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex sm:flex-row flex-col gap-3">
          <Link
            href="/dashboard/appointments"
            className="flex-1 bg-violet-700 hover:bg-violet-600 px-6 py-3  font-semibold text-center transition-colors"
          >
            ดูการจองของฉัน
          </Link>
          <Link
            href="/hospitals"
            className="flex-1 bg-zinc-100 hover:bg-zinc-600 px-6 py-3 border border-zinc-600  font-semibold text-center transition-colors"
          >
            กลับไปหน้าโรงพยาบาล
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HospitalBookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
          <div className="border-4 border-red-600 border-t-transparent  w-12 h-12 animate-spin"></div>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}