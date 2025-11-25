/**
 * Utility functions for extracting and handling image URLs in card components
 */

const FALLBACK_IMAGE = "/assets/images/fallback-img.jpg";

/**
 * Extracts the primary image URL from an object that may have `image` or `images` properties
 * @param image - Single image string or null
 * @param images - Array of image strings or null/undefined
 * @param fallback - Optional fallback image URL (defaults to standard fallback)
 * @returns The first available image URL or fallback
 */
export function getImageUrl(
  image?: string | null,
  images?: string[] | null,
  fallback: string = FALLBACK_IMAGE
): string {
  return image || images?.[0] || fallback;
}

/**
 * Type guard for objects with image properties
 */
export interface ImageSource {
  image?: string | null;
  images?: string[] | null;
}

/**
 * Extracts image URL from an object with image properties
 */
export function extractImageUrl(
  source: ImageSource,
  fallback: string = FALLBACK_IMAGE
): string {
  return getImageUrl(source.image, source.images, fallback);
}

