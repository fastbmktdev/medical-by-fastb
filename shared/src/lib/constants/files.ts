/**
 * File Upload Constants
 * Configuration for file uploads and validation
 */

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Maximum file size for images (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Maximum file size for documents (10MB)
 */
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Allowed document MIME types
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

/**
 * Allowed video MIME types
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
] as const;

/**
 * File type configurations
 */
export const FILE_TYPE_CONFIGS = {
  image: {
    maxSize: MAX_IMAGE_SIZE,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  document: {
    maxSize: MAX_DOCUMENT_SIZE,
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
  },
  video: {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_VIDEO_TYPES,
    extensions: ['.mp4', '.mpeg', '.mov', '.webm'],
  },
} as const;

export type FileType = keyof typeof FILE_TYPE_CONFIGS;
