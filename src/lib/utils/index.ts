// General Utilities Barrel Export
// Optimized for tree-shaking with focused exports

// Most commonly used utilities
export { cn } from './cn';
export { showSuccessToast, showErrorToast } from './toast';

// Formatting utilities
export { 
  formatDate, 
  formatPhoneNumber 
} from './formatters';

// Text and Slug utilities (consolidated in text-utils)
export {
  truncateText,
  slugify,
  getInitials,
  isValidSlug,
  previewSlug
} from './text-utils';

// Alias for backward compatibility
export { slugify as generateSlug } from './text-utils';
