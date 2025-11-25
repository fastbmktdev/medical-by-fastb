/**
 * Slug Utilities
 * Functions for generating and validating URL-friendly slugs
 * 
 * @deprecated Use text-utils.ts instead. This file is kept for backward compatibility.
 * Will be removed in a future version.
 */

// Re-export from text-utils for backward compatibility
export { slugify as generateSlug, isValidSlug, previewSlug } from './text-utils';
