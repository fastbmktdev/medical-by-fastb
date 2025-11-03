'use client';

import { useState } from 'react';
import {
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  usePaymentData,
  PaymentStatusDisplay,
  getPaymentTypeText,
  formatPaymentDate,
  formatAmount
} from './shared';

export default function PaymentStatus() {
  const { payments, loading, error, refreshPayments } = usePaymentData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPayments();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="text-center py-12">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-brand-primary hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors"
           aria-label="Button">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">สถานะการชำระเงิน</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
         aria-label="Button">
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">ไม่มีข้อมูลการชำระเงิน</h3>
          <p className="text-zinc-400">
            ยังไม่มีการชำระเงินในระบบ
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-zinc-700 rounded-lg p-6 border border-zinc-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <PaymentStatusDisplay status={payment.status} size="lg" />
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white">
                        {getPaymentTypeText(payment.payment_type)}
                      </h4>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">จำนวนเงิน:</span>
                        <span className=" font-semibold">
                          {formatAmount(payment.amount)}
                        </span>
                      </div>

                      {payment.order_number && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">หมายเลขคำสั่งซื้อ:</span>
                          <span className=" font-mono text-sm">
                            {payment.order_number}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-zinc-400">วันที่สร้าง:</span>
                        <span className="text-white">
                          {formatPaymentDate(payment.created_at)}
                        </span>
                      </div>

                      {payment.updated_at !== payment.created_at && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">อัปเดตล่าสุด:</span>
                          <span className="text-white">
                            {formatPaymentDate(payment.updated_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-600 transition-colors" aria-label="Button">
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {payment.status === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/50 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⏳ การชำระเงินของคุณกำลังรอดำเนินการ กรุณารอสักครู่
                  </p>
                </div>
              )}

              {payment.status === 'processing' && (
                <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/50 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    🔄 กำลังดำเนินการชำระเงิน กรุณารอสักครู่
                  </p>
                </div>
              )}

              {payment.status === 'failed' && (
                <div className="mt-4 p-3 bg-brand-primary/10 border border-red-600/50 rounded-lg">
                  <p className="text-red-400 text-sm">
                    ❌ การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
