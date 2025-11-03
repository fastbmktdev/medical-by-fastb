'use client';

import { useState } from 'react';
import { 
  XCircleIcon, 
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { 
  usePaymentData,
  PaymentStatusDisplay,
  getPaymentTypeText,
  formatPaymentDate,
  formatAmount,
  PaymentRecord
} from './shared';

export default function PaymentHistory() {
  const { payments, loading, error, refreshPayments } = usePaymentData();
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);



  if (loading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">กำลังโหลดประวัติการชำระเงิน...</p>
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
            onClick={refreshPayments}
            className="bg-brand-primary hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors"
           aria-label="Button">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">ประวัติการชำระเงิน</h3>
            <p className="text-zinc-400">รายการการชำระเงินทั้งหมดของคุณ</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-sm">จำนวนรายการ</p>
            <p className=" text-2xl font-bold">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg p-6">
          <div className="text-center py-12">
            <CurrencyDollarIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">ยังไม่มีประวัติการชำระเงิน</h3>
            <p className="text-zinc-400">เมื่อคุณทำการชำระเงิน รายการจะปรากฏที่นี่</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <PaymentStatusDisplay status={payment.status} size="md" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-white">
                        {getPaymentTypeText(payment.payment_type)}
                      </h4>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      หมายเลขคำสั่งซื้อ: {payment.order_number}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-400 text-sm">
                          {formatPaymentDate(payment.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatAmount(payment.amount)}
                  </p>
                  <button
                    onClick={() => setSelectedPayment(payment)}
                    className="mt-2 flex items-center space-x-1 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>ดูรายละเอียด</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">รายละเอียดการชำระเงิน</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-sm">หมายเลขคำสั่งซื้อ</label>
                  <p className=" font-mono">{selectedPayment.order_number}</p>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">สถานะ</label>
                  <PaymentStatusDisplay status={selectedPayment.status} size="md" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">ประเภท</label>
                  <p className="text-white">{getPaymentTypeText(selectedPayment.payment_type)}</p>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">จำนวนเงิน</label>
                  <p className=" text-xl font-bold">
                    {formatAmount(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm">วันที่สร้าง</label>
                  <p className="text-white">{formatPaymentDate(selectedPayment.created_at)}</p>
                </div>
              </div>

              {selectedPayment.metadata && Object.keys(selectedPayment.metadata).length > 0 && (
                <div>
                  <label className="text-zinc-400 text-sm">ข้อมูลเพิ่มเติม</label>
                  <div className="bg-zinc-700 rounded-lg p-4 mt-2">
                    <pre className="text-zinc-300 text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedPayment.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedPayment(null)}
                className="bg-zinc-600 hover:bg-zinc-500 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
