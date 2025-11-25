/**
 * Mock product data generator
 */

import { faker } from '@faker-js/faker';
import type { Product } from '@shared/types/app.types';

/**
 * Generate mock product
 */
export function generateMockProduct(overrides?: Partial<Product>): Product {
  const nameThai = faker.commerce.productName();
  const nameEnglish = faker.commerce.productName();
  const slug = faker.helpers.slugify(nameThai.toLowerCase());

  return {
    id: faker.string.uuid(),
    slug: slug,
    nameThai: nameThai,
    nameEnglish: nameEnglish,
    description: faker.commerce.productDescription(),
    price: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
    stock: faker.number.int({ min: 0, max: 100 }),
    category: faker.helpers.arrayElement([
      'อาหารเสริม',
      'อุปกรณ์',
      'เครื่องสำอาง',
      'อื่นๆ',
    ]),
    image: faker.image.url(),
    images: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
      faker.image.url()
    ),
    ...overrides,
  };
}

/**
 * Generate multiple mock products
 */
export function generateMockProducts(count: number = 20): Product[] {
  return Array.from({ length: count }, () => generateMockProduct());
}

