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

// File validation utilities
export { 
  validateFile, 
  validateFiles, 
  validateFileClient,
  sanitizeFilename,
  FILE_TYPE_CONFIGS,
  type FileValidationResult,
  type FileTypeConfig
} from './file-validation';

// XSS Sanitization utilities
export {
  sanitizeHTML,
  sanitizeText,
  sanitizeAttribute,
  sanitizeURL,
  getSanitizedHTMLProps,
  containsDangerousHTML
} from './sanitize';

// QR Code utilities
export {
  generateQRCodeDataURL,
  generateQRCodeBuffer,
  generateQRCodeString
} from './qrcode';

// Audit logging utilities
export {
  logAuditEvent,
  type AuditLogEventOptions
} from './audit-log';

// Number utilities
export {
  roundToTwoDecimals,
  sanitizePrice,
  formatDateComponents,
  generateNumberWithPrefix,
} from './number-utils';

// Logger utilities
export {
  logger,
  createScopedLogger,
  type Logger,
} from './logger';
