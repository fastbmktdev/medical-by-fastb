/**
 * Apply Coupon Code API
 * POST /api/payments/apply-coupon
 * Validates and applies a coupon code to a checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { validateCoupon, type ValidateCouponInput } from '@shared/services/promotion.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      couponCode?: string;
      amount?: number;
      paymentType?: string;
      productId?: string;
      hospitalId?: string;
      packageId?: string;
    };
    const {
      couponCode,
      amount,
      paymentType,
      productId,
      hospitalId,
      packageId,
    } = body;

    // Validate required fields
    if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid coupon code',
          message: 'กรุณากรอกโค้ดส่วนลด',
        },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount',
          message: 'ยอดซื้อไม่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    if (!paymentType || !['hospital_booking', 'product', 'ticket'].includes(paymentType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment type',
          message: 'ประเภทการชำระเงินไม่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    // Validate coupon
    const validateInput: ValidateCouponInput = {
      couponCode: couponCode.trim(),
      userId: user.id,
      amount,
      paymentType: paymentType as 'hospital_booking' | 'product' | 'ticket',
      productId,
      hospitalId,
      packageId,
    };

    const result = await validateCoupon(validateInput);

    if (!result.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Invalid coupon',
          message: result.error || 'ไม่สามารถใช้โค้ดส่วนลดนี้ได้',
          discount: result.discount,
        },
        { status: 400 }
      );
    }

    // Return success with discount information
    return NextResponse.json({
      success: true,
      promotion: {
        id: result.promotion?.id,
        title: result.promotion?.title,
        title_english: result.promotion?.title_english,
        description: result.promotion?.description,
        free_shipping: result.promotion?.free_shipping || false,
      },
      discount: {
        originalPrice: result.discount.originalPrice,
        discountAmount: result.discount.discountAmount,
        finalPrice: result.discount.finalPrice,
        promotionId: result.discount.promotionId,
      },
      message: 'ใช้โค้ดส่วนลดสำเร็จ',
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

