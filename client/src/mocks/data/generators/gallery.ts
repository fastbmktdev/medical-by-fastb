/**
 * Mock gallery data generator
 */

import { faker } from '@faker-js/faker';
import type { GalleryImage } from '@shared/types/gallery.types';

/**
 * Generate mock gallery image
 */
export function generateMockGalleryImage(
  hospitalId: string,
  overrides?: Partial<GalleryImage>
): GalleryImage {
  const width = faker.number.int({ min: 800, max: 2000 });
  const height = faker.number.int({ min: 600, max: 1500 });
  const fileSize = width * height * 3; // Approximate file size

  return {
    id: faker.string.uuid(),
    hospital_id: hospitalId,
    image_url: faker.image.url({ width, height }),
    storage_path: `hospital-images/${hospitalId}/${faker.string.uuid()}.jpg`,
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    alt_text: faker.lorem.sentence(),
    is_featured: faker.datatype.boolean({ probability: 0.1 }),
    display_order: faker.number.int({ min: 0, max: 100 }),
    file_size: fileSize,
    width: width,
    height: height,
    mime_type: 'image/jpeg',
    uploaded_by: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock gallery images
 */
export function generateMockGalleryImages(
  hospitalIds: string[],
  imagesPerHospital: number = 5
): GalleryImage[] {
  const images: GalleryImage[] = [];
  hospitalIds.forEach((hospitalId) => {
    for (let i = 0; i < imagesPerHospital; i++) {
      images.push(generateMockGalleryImage(hospitalId, { display_order: i }));
    }
  });
  return images;
}

