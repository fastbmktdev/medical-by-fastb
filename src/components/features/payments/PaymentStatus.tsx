'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface PaymentStatusData {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  payment_type: 'gym_booking' | 'product' | 'ticket';
  created_at: string;
  updated_at: string;
  order_number?: string;
  metadata?: Record<string, any>;
}

export default function PaymentStatus() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      const response = await fetch('/api/payments/user-payments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'canceled':
        return <XCircleIcon className="w-6 h-6 text-gray-500" />;
      case 'refunded':
        return <ArrowPathIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return { text: 'สำเร็จ', color: 'text-green-400' };
      case 'failed':
        return { text: 'ล้มเหลว', color: 'text-red-400' };
      case 'pending':
        return { text: 'รอดำเนินการ', color: 'text-yellow-400' };
      case 'processing':
        return { text: 'กำลังดำเนินการ', color: 'text-yellow-400' };
      case 'canceled':
        return { text: 'ยกเลิก', color: 'text-gray-400' };
      case 'refunded':
        return { text: 'คืนเงิน', color: 'text-blue-400' };
      default:
        return { text: 'ไม่ทราบสถานะ', color: 'text-gray-400' };
    }
  };

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'gym_booking':
        return 'จองค่ายมวย';
      case 'product':
        return 'ซื้อสินค้า';
      case 'ticket':
        return 'ซื้อตั๋ว';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefresh = () => {
    fetchPayments();
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
          <h3 className="text-xl font-semibold text-white mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
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
          className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">ไม่มีข้อมูลการชำระเงิน</h3>
          <p className="text-zinc-400">
            ยังไม่มีการชำระเงินในระบบ
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const statusInfo = getStatusText(payment.status);
            
            return (
              <div
                key={payment.id}
                className="bg-zinc-700 rounded-lg p-6 border border-zinc-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">
                          {getPaymentTypeText(payment.payment_type)}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-zinc-800`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">จำนวนเงิน:</span>
                          <span className="text-white font-semibold">
                            ฿{payment.amount.toLocaleString()}
                          </span>
                        </div>
                        
                        {payment.order_number && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">หมายเลขคำสั่งซื้อ:</span>
                            <span className="text-white font-mono text-sm">
                              {payment.order_number}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-zinc-400">วันที่สร้าง:</span>
                          <span className="text-white">
                            {formatDate(payment.created_at)}
                          </span>
                        </div>
                        
                        {payment.updated_at !== payment.created_at && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">อัปเดตล่าสุด:</span>
                            <span className="text-white">
                              {formatDate(payment.updated_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-600 transition-colors">
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
                  <div className="mt-4 p-3 bg-red-600/10 border border-red-600/50 rounded-lg">
                    <p className="text-red-400 text-sm">
                      ❌ การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
