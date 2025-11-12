import { NextRequest } from 'next/server';

const createClientMock = jest.fn();
const validateCouponMock = jest.fn();

jest.mock('@/lib/database/supabase/server', () => ({
  createClient: createClientMock,
}));

jest.mock('@/services/promotion.service', () => ({
  validateCoupon: validateCouponMock,
}));

/**
 * Helper to create a NextRequest for POST with JSON body
 */
const createJsonRequest = (body: Record<string, unknown>): NextRequest =>
  new NextRequest(
    new Request('http://localhost/api/payments/apply-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );

/**
 * Helper to mock Supabase Auth Client
 */
const createSupabaseAuthClient = (userId?: string) => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
      error: null,
    }),
  },
});

describe('POST /api/payments/apply-coupon', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    createClientMock.mockResolvedValueOnce(createSupabaseAuthClient());

    const { POST } = await import('../../../src/app/api/payments/apply-coupon/route');

    const response = await POST(
      createJsonRequest({
        couponCode: 'WELCOME10',
        amount: 1200,
        paymentType: 'gym_booking',
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toMatch(/Unauthorized/);
  });

  it('returns 400 when coupon code is missing', async () => {
    createClientMock.mockResolvedValueOnce(createSupabaseAuthClient('user-1'));

    const { POST } = await import('../../../src/app/api/payments/apply-coupon/route');

    const response = await POST(
      createJsonRequest({
        amount: 1200,
        paymentType: 'gym_booking',
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/coupon code/);
  });

  it('returns 400 when amount is invalid', async () => {
    createClientMock.mockResolvedValueOnce(createSupabaseAuthClient('user-1'));

    const { POST } = await import('../../../src/app/api/payments/apply-coupon/route');

    const response = await POST(
      createJsonRequest({
        couponCode: 'WELCOME10',
        amount: 0,
        paymentType: 'gym_booking',
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Invalid amount/);
  });

  it('returns 400 when payment type is invalid', async () => {
    createClientMock.mockResolvedValueOnce(createSupabaseAuthClient('user-1'));

    const { POST } = await import('../../../src/app/api/payments/apply-coupon/route');

    const response = await POST(
      createJsonRequest({
        couponCode: 'WELCOME10',
        amount: 1500,
        paymentType: 'invalid-type',
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Invalid payment type/);
  });

  it('returns 400 when coupon validation fails', async () => {
    createClientMock.mockResolvedValueOnce(createSupabaseAuthClient('user-1'));
    validateCouponMock.mockResolvedValueOnce({
      isValid: false,
      promotion: null,
      discount: {
        originalPrice: 1500,
        discountAmount: 0,
        finalPrice: 1500,
        promotionId: null,
        isValid: false,
      },
      error: 'ไม่พบโค้ดส่วนลดนี้',
    });

    const { POST } = await import('../../../src/app/api/payments/apply-coupon/route');

    const response = await POST(
      createJsonRequest({
        couponCode: 'INVALID',
        amount: 1500,
        paymentType: 'gym_booking',
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/ไม่พบโค้ดส่วนลดนี้/);
  });

  it('applies coupon successfully', async () => {
    createClientMock.mockResolvedValueOnce(createSupabaseAuthClient('user-1'));
    validateCouponMock.mockResolvedValueOnce({
      isValid: true,
      promotion: {
        id: 'promo-1',
        title: 'ส่วนลด 10%',
        title_english: '10% Off',
        description: 'ลดราคาพิเศษ',
        free_shipping: false,
      },
      discount: {
        originalPrice: 1500,
        discountAmount: 150,
        finalPrice: 1350,
        promotionId: 'promo-1',
        isValid: true,
      },
    });

    const { POST } = await import('../../../src/app/api/payments/apply-coupon/route');

    const response = await POST(
      createJsonRequest({
        couponCode: 'WELCOME10',
        amount: 1500,
        paymentType: 'gym_booking',
        productId: null,
        gymId: 'gym-1',
        packageId: 'package-1',
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.discount.finalPrice).toBe(1350);
    expect(validateCouponMock).toHaveBeenCalledWith(
      expect.objectContaining({
        couponCode: 'WELCOME10',
        userId: 'user-1',
        amount: 1500,
      })
    );
  });
});