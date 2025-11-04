/**
 * Slug Utilities
 * Functions for generating and validating URL-friendly slugs
 */

/**
 * Converts a string to a URL-friendly slug.
 * Supports English and Thai characters.
 * @param text - The text to slugify.
 * @returns The slugified string.
 */
export function generateSlug(text: string): string {
  if (!text || text.trim() === '') {
    return '';
  }
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]+/g, '') // Remove special characters but keep Thai/unicode
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Preview what a slug will look like
 * @param text - The text to preview as a slug
 * @returns The slug preview
 */
export function previewSlug(text: string): string {
  if (!text || text.trim() === '') {
    return '';
  }
  return generateSlug(text);
}

/**
 * Validates if a string is a valid slug format
 * @param slug - The slug to validate
 * @returns True if the slug is valid
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.trim() === '') {
    return false;
  }
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
