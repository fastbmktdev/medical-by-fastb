/**
 * Mock payment data generator
 */

import { faker } from '@faker-js/faker';

export interface Payment {
  id: string;
  user_id: string;
  payment_type: 'booking' | 'product' | 'subscription' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  payment_method: 'credit_card' | 'debit_card' | 'promptpay' | 'truewallet' | 'bank_transfer' | 'other';
  stripe_payment_intent_id?: string | null;
  stripe_customer_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Generate mock payment
 */
export function generateMockPayment(
  userId: string,
  overrides?: Partial<Payment>
): Payment {
  const amount = faker.number.float({ min: 100, max: 10000, fractionDigits: 2 });
  const paymentType = faker.helpers.arrayElement([
    'booking',
    'product',
    'subscription',
    'refund',
  ]);
  const status = faker.helpers.arrayElement([
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled',
  ]);

  return {
    id: faker.string.uuid(),
    user_id: userId,
    payment_type: paymentType,
    amount: amount,
    currency: 'THB',
    status: status,
    payment_method: faker.helpers.arrayElement([
      'credit_card',
      'debit_card',
      'promptpay',
      'truewallet',
      'bank_transfer',
      'other',
    ]),
    stripe_payment_intent_id:
      status === 'succeeded' || status === 'processing'
        ? `pi_${faker.string.alphanumeric(24)}`
        : null,
    stripe_customer_id: `cus_${faker.string.alphanumeric(24)}`,
    metadata: {
      booking_id: paymentType === 'booking' ? faker.string.uuid() : undefined,
      order_id: paymentType === 'product' ? faker.string.uuid() : undefined,
      description: faker.lorem.sentence(),
    },
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock payments
 */
export function generateMockPayments(userIds: string[], count: number = 30): Payment[] {
  return Array.from({ length: count }, () => {
    const userId = faker.helpers.arrayElement(userIds);
    return generateMockPayment(userId);
  });
}

