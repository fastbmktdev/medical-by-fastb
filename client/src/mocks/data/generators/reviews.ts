/**
 * Mock review data generator
 */

import { faker } from '@faker-js/faker';
import type { HospitalReview } from '@shared/types/review.types';

/**
 * Generate mock hospital review
 */
export function generateMockReview(
  hospitalId: string,
  userId: string,
  overrides?: Partial<HospitalReview>
): HospitalReview {
  const rating = faker.number.int({ min: 1, max: 5 });
  const status = faker.helpers.arrayElement([
    'pending',
    'approved',
    'rejected',
    'hidden',
    'flagged',
  ]);
  const hasBooking = faker.datatype.boolean({ probability: 0.7 });

  return {
    id: faker.string.uuid(),
    hospital_id: hospitalId,
    user_id: userId,
    booking_id: hasBooking ? faker.string.uuid() : null,
    rating: rating,
    title: faker.lorem.sentence(),
    comment: faker.lorem.paragraphs(2),
    visit_date: faker.date.past().toISOString().split('T')[0],
    recommend: faker.datatype.boolean({ probability: 0.8 }),
    status: status,
    moderation_reason:
      status === 'rejected' || status === 'hidden'
        ? faker.helpers.arrayElement(['spam', 'inappropriate', 'fake'])
        : null,
    moderated_by: status === 'rejected' || status === 'hidden' ? faker.string.uuid() : null,
    moderated_at:
      status === 'rejected' || status === 'hidden'
        ? faker.date.recent().toISOString()
        : null,
    is_verified_visit: hasBooking,
    is_featured: faker.datatype.boolean({ probability: 0.1 }),
    flag_count: faker.number.int({ min: 0, max: 5 }),
    google_review_id: faker.datatype.boolean({ probability: 0.2 })
      ? faker.string.alphanumeric(27)
      : null,
    source: faker.helpers.arrayElement(['platform', 'google', 'facebook', 'tripadvisor']),
    has_response: faker.datatype.boolean({ probability: 0.3 }),
    helpful_count: faker.number.int({ min: 0, max: 50 }),
    views_count: faker.number.int({ min: 0, max: 200 }),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock reviews
 */
export function generateMockReviews(
  hospitalIds: string[],
  userIds: string[],
  count: number = 50
): HospitalReview[] {
  return Array.from({ length: count }, () => {
    const hospitalId = faker.helpers.arrayElement(hospitalIds);
    const userId = faker.helpers.arrayElement(userIds);
    return generateMockReview(hospitalId, userId);
  });
}

