/**
 * Mock user data generator
 */

import { faker } from '@faker-js/faker';
import type { Profile, UserRole } from '@shared/types/database.types';

/**
 * Generate mock user profile
 */
export function generateMockProfile(overrides?: Partial<Profile>): Profile {
  const userId = faker.string.uuid();
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const username = faker.internet.userName({ firstName, lastName }).toLowerCase();

  return {
    user_id: userId,
    username: username,
    full_name: fullName,
    avatar_url: faker.image.avatar(),
    bio: faker.person.bio(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock user role
 */
export function generateMockUserRole(
  userId?: string,
  role: 'authenticated' | 'partner' | 'admin' = 'authenticated',
  overrides?: Partial<UserRole>
): UserRole {
  return {
    user_id: userId || faker.string.uuid(),
    role,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock profiles
 */
export function generateMockProfiles(count: number = 10): Profile[] {
  return Array.from({ length: count }, () => generateMockProfile());
}

/**
 * Generate multiple mock user roles
 */
export function generateMockUserRoles(
  count: number = 10,
  role?: 'authenticated' | 'partner' | 'admin'
): UserRole[] {
  return Array.from({ length: count }, () => generateMockUserRole(undefined, role));
}

