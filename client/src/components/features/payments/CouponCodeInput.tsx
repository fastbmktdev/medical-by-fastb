'use client';

import { useState } from 'react';

export interface CouponDiscount {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  promotionId: string;
  promotionTitle?: string;
  freeShipping?: boolean;
}

interface CouponCodeInputProps {
  originalAmount: number;
  paymentType: 'hospital_booking' | 'product' | 'ticket';
  productId?: string;
  hospitalId?: string;
  packageId?: string;
  onCouponApplied: (discount: CouponDiscount | null) => void;
  onError?: (error: string) => void;
}

export default function CouponCodeInput({
  originalAmount,
  paymentType,
  productId,
  hospitalId,
  packageId,
  onCouponApplied,
  onError,
}: CouponCodeInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<CouponDiscount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('กรุณากรอกโค้ดส่วนลด');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          amount: originalAmount,
          paymentType,
          productId,
          hospitalId,
          packageId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || 'ไม่สามารถใช้โค้ดส่วนลดนี้ได้';
        setError(errorMessage);
        setAppliedDiscount(null);
        onCouponApplied(null);
        onError?.(errorMessage);
        return;
      }

      const discount: CouponDiscount = {
        originalPrice: data.discount.originalPrice,
        discountAmount: data.discount.discountAmount,
        finalPrice: data.discount.finalPrice,
        promotionId: data.discount.promotionId,
        promotionTitle: data.promotion?.title,
        freeShipping: data.promotion?.free_shipping || false,
      };

      setAppliedDiscount(discount);
      onCouponApplied(discount);
    } catch (err) {
      const errorMessage = 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด';
      setError(errorMessage);
      setAppliedDiscount(null);
      onCouponApplied(null);
      onError?.(errorMessage);
      console.error('Error applying coupon:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedDiscount(null);
    setError(null);
    onCouponApplied(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="กรอกโค้ดส่วนลด"
          className="flex-1 px-4 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading || !!appliedDiscount}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !loading && !appliedDiscount) {
              handleApplyCoupon();
            }
          }}
        />
        {!appliedDiscount ? (
          <button
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode.trim()}
            className="px-6 py-2 bg-blue-600 text-zinc-950  hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'ใช้โค้ด'}
          </button>
        ) : (
          <button
            onClick={handleRemoveCoupon}
            className="px-6 py-2 bg-red-600 text-zinc-950  hover:bg-red-600 transition-colors"
          >
            ลบ
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 ">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {appliedDiscount && appliedDiscount.discountAmount > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                ✓ ใช้โค้ดส่วนลดสำเร็จ
                {appliedDiscount.promotionTitle && (
                  <span className="ml-2 text-green-600">
                    ({appliedDiscount.promotionTitle})
                  </span>
                )}
              </p>
              {appliedDiscount.freeShipping && (
                <p className="text-xs text-green-600 mt-1">
                  🎁 รวมส่งฟรี
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">
                ส่วนลด: -฿{appliedDiscount.discountAmount.toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

