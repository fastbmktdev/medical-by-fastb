/**
 * Mock booking/appointment data generator
 */

import { faker } from '@faker-js/faker';
import type { appointment } from '@shared/types/database.types';

/**
 * Generate mock appointment/booking
 */
export function generateMockAppointment(
  userId: string,
  hospitalId: string,
  packageId: string,
  packageName: string,
  packageType: 'one_time' | 'package',
  overrides?: Partial<appointment>
): appointment {
  const startDate = faker.date.future();
  const endDate =
    packageType === 'package'
      ? new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days later
      : null;
  const durationMonths = packageType === 'package' ? faker.helpers.arrayElement([1, 3, 6]) : null;
  const pricePaid = faker.number.float({ min: 500, max: 10000, fractionDigits: 2 });
  const discountAmount = faker.datatype.boolean({ probability: 0.3 })
    ? faker.number.float({ min: 0, max: pricePaid * 0.3, fractionDigits: 2 })
    : null;

  return {
    id: faker.string.uuid(),
    user_id: userId,
    hospital_id: hospitalId,
    package_id: packageId,
    booking_number: `BK${faker.string.alphanumeric(8).toUpperCase()}`,
    customer_name: faker.person.fullName(),
    customer_email: faker.internet.email(),
    customer_phone: faker.phone.number(),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate ? endDate.toISOString().split('T')[0] : null,
    price_paid: pricePaid,
    discount_amount: discountAmount,
    promotion_id: faker.datatype.boolean({ probability: 0.2 })
      ? faker.string.uuid()
      : null,
    package_name: packageName,
    package_type: packageType,
    duration_months: durationMonths,
    special_requests: faker.datatype.boolean({ probability: 0.3 })
      ? faker.lorem.sentence()
      : undefined,
    payment_status: faker.helpers.arrayElement(['pending', 'paid', 'failed', 'refunded']),
    payment_method: faker.helpers.arrayElement(['credit_card', 'promptpay', 'truewallet', 'bank_transfer']),
    payment_id: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock appointments
 */
export function generateMockAppointments(
  userIds: string[],
  hospitalIds: string[],
  packageIds: string[],
  packageNames: string[],
  packageTypes: ('one_time' | 'package')[],
  count: number = 20
): appointment[] {
  return Array.from({ length: count }, () => {
    const userId = faker.helpers.arrayElement(userIds);
    const hospitalId = faker.helpers.arrayElement(hospitalIds);
    const packageIndex = faker.number.int({ min: 0, max: packageIds.length - 1 });
    const packageId = packageIds[packageIndex];
    const packageName = packageNames[packageIndex] || 'Package';
    const packageType = packageTypes[packageIndex] || 'one_time';

    return generateMockAppointment(userId, hospitalId, packageId, packageName, packageType);
  });
}

