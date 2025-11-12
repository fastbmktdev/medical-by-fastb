/**
 * File Upload Validation Utility
 * 
 * Comprehensive file validation with virus/malware protection
 * - MIME type validation
 * - Magic bytes verification (content-based validation)
 * - File size limits
 * - Filename sanitization
 * - Suspicious content detection
 */

// Supported file types with their MIME types and magic bytes
export interface FileTypeConfig {
  mimeTypes: string[];
  extensions: string[];
  magicBytes: number[][]; // Array of possible magic byte patterns
  maxSize: number; // in bytes
}

export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  image_jpeg: {
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['jpg', 'jpeg'],
    magicBytes: [
      [0xFF, 0xD8, 0xFF], // JPEG standard
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  image_png: {
    mimeTypes: ['image/png'],
    extensions: ['png'],
    magicBytes: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG standard
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  image_webp: {
    mimeTypes: ['image/webp'],
    extensions: ['webp'],
    magicBytes: [
      [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
};

// Dangerous file extensions that should be blocked
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'app', 'deb', 'pkg', 'rpm', 'msi', 'dmg', 'sh', 'bin',
  'php', 'php3', 'php4', 'php5', 'phtml', 'asp', 'aspx', 'jsp',
  'py', 'rb', 'pl', 'sh', 'ps1', 'psm1', 'psd1',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', // Office files can contain macros
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', // Archives
  'sql', 'db', 'sqlite', 'mdb',
];

// Suspicious patterns in file content (heuristics for malware detection)
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>/i, // Script tags
  /javascript:/i, // JavaScript protocol
  /on\w+\s*=/i, // Event handlers
  /eval\s*\(/i, // eval() calls
  /base64/i, // Base64 encoding (often used to hide malicious code)
  /document\.cookie/i, // Cookie access
  /window\.location/i, // Redirect attempts
  /\.exec\s*\(/i, // exec calls
  /\.system\s*\(/i, // system calls
  /powershell/i, // PowerShell commands
  /cmd\.exe/i, // Command prompt
  /\/bin\/sh/i, // Shell access
];

/**
 * Read magic bytes from file
 */
async function readMagicBytes(file: File, length: number = 16): Promise<number[]> {
  // Browser environment: use FileReader
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        resolve(Array.from(bytes.slice(0, length)));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file.slice(0, length));
    });
  }

  // Server environment: use arrayBuffer() if available
  if (typeof file.arrayBuffer === 'function') {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes.slice(0, length));
  }

  // Fallback: unable to read magic bytes
  return [];
}

/**
 * Check if magic bytes match expected pattern
 */
function matchesMagicBytes(fileBytes: number[], pattern: number[]): boolean {
  if (fileBytes.length < pattern.length) return false;
  
  for (let i = 0; i < pattern.length; i++) {
    if (fileBytes[i] !== pattern[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Validate file extension
 */
function validateExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  
  // Check if extension is in dangerous list
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return false;
  }
  
  // Check if extension is allowed
  return allowedExtensions.includes(extension);
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\:*?"<>|]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, ''); // Remove trailing dots
  
  // Limit filename length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, maxLength - (ext?.length || 0) - 1);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized || 'file';
}

/**
 * Check file content for suspicious patterns
 */
async function checkSuspiciousContent(file: File): Promise<string | null> {
  // Only check text-based files for suspicious patterns
  if (!file.type.startsWith('text/') && !file.type.includes('javascript')) {
    // For binary files, read first 10KB and check
    const sample = file.slice(0, 10 * 1024);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(sample);
    });
    
    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        return 'ไฟล์มีเนื้อหาที่น่าสงสัยและอาจเป็นอันตราย';
      }
    }
  }
  
  return null;
}

/**
 * Validate file type using magic bytes
 */
async function validateFileType(file: File, config: FileTypeConfig): Promise<boolean> {
  try {
    const magicBytes = await readMagicBytes(file, 16);
    
    // Check if any of the magic byte patterns match
    for (const pattern of config.magicBytes) {
      if (matchesMagicBytes(magicBytes, pattern)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error reading magic bytes:', error);
    return false;
  }
}

/**
 * Comprehensive file validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFilename?: string;
  detectedType?: string;
}

/**
 * Validate file with comprehensive security checks
 * 
 * @param file - File to validate
 * @param allowedTypes - Array of allowed file type keys (e.g., ['image_jpeg', 'image_png'])
 * @returns Validation result
 */
export async function validateFile(
  file: File,
  allowedTypes: string[] = ['image_jpeg', 'image_png', 'image_webp']
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get allowed file type configs
  const allowedConfigs = allowedTypes
    .map(type => FILE_TYPE_CONFIGS[type])
    .filter(Boolean);
  
  if (allowedConfigs.length === 0) {
    return {
      isValid: false,
      errors: ['ไม่มีประเภทไฟล์ที่อนุญาต'],
      warnings: [],
    };
  }
  
  // 1. Validate file size (use smallest max size from allowed types)
  const maxSize = Math.min(...allowedConfigs.map(config => config.maxSize));
  if (file.size > maxSize) {
    errors.push(`ขนาดไฟล์เกิน ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
  }
  
  if (file.size === 0) {
    errors.push('ไฟล์ว่างเปล่า');
  }
  
  // 2. Validate MIME type
  const validMimeTypes = allowedConfigs.flatMap(config => config.mimeTypes);
  if (!validMimeTypes.includes(file.type)) {
    errors.push(`ประเภทไฟล์ไม่ถูกต้อง: ${file.type || 'ไม่ระบุ'}`);
  }
  
  // 3. Validate file extension
  const validExtensions = allowedConfigs.flatMap(config => config.extensions);
  if (!validateExtension(file.name, validExtensions)) {
    errors.push(`นามสกุลไฟล์ไม่ถูกต้องหรือไม่ปลอดภัย: ${file.name.split('.').pop()}`);
  }
  
  // 4. Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);
  if (sanitizedFilename !== file.name) {
    warnings.push(`ชื่อไฟล์ถูกปรับให้ปลอดภัย: ${sanitizedFilename}`);
  }
  
 // 5. Validate file content using magic bytes (critical security check)
  let contentTypeValid = false;
  let detectedType: string | undefined;
  
  for (const [typeKey, config] of Object.entries(FILE_TYPE_CONFIGS)) {
    if (allowedTypes.includes(typeKey)) {
      const isValid = await validateFileType(file, config);
      if (isValid) {
        contentTypeValid = true;
        detectedType = typeKey;
        
        // Double-check: if MIME type doesn't match detected type, it's suspicious
        if (!config.mimeTypes.includes(file.type)) {
          errors.push('ประเภทไฟล์ไม่ตรงกับเนื้อหาจริง (อาจมีการปลอมแปลง)');
        }
        break;
      }
    }
  }
  
  if (!contentTypeValid) {
    errors.push('เนื้อหาไฟล์ไม่ตรงกับประเภทที่ระบุ (อาจไม่ปลอดภัย)');
  } 
  
  // 6. Check for suspicious content
  try {
    const suspiciousError = await checkSuspiciousContent(file);
    if (suspiciousError) {
      errors.push(suspiciousError);
    }
  } catch (error) {
    // If we can't check content, log but don't fail (might be binary file)
    console.warn('Could not check file content for suspicious patterns:', error);
  }
  
  // 7. Additional heuristics for image files
  if (file.type.startsWith('image/') && detectedType?.startsWith('image_')) {
    // Check if file is too small (might be corrupted or malicious)
    if (file.size < 100) {
      warnings.push('ไฟล์มีขนาดเล็กมาก อาจไม่ใช่ไฟล์รูปภาพที่ถูกต้อง');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedFilename,
    detectedType,
  };
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  allowedTypes: string[] = ['image_jpeg', 'image_png', 'image_webp']
): Promise<FileValidationResult[]> {
  return Promise.all(files.map(file => validateFile(file, allowedTypes)));
}

/**
 * Client-side validation (lightweight, without magic bytes check)
 * Use this for immediate feedback before actual upload
 */
export function validateFileClient(file: File, allowedTypes: string[] = ['image_jpeg', 'image_png', 'image_webp']): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const allowedConfigs = allowedTypes
    .map(type => FILE_TYPE_CONFIGS[type])
    .filter(Boolean);
  
  if (allowedConfigs.length === 0) {
    return {
      isValid: false,
      errors: ['ไม่มีประเภทไฟล์ที่อนุญาต'],
      warnings: [],
    };
  }
  
  // File size check
  const maxSize = Math.min(...allowedConfigs.map(config => config.maxSize));
  if (file.size > maxSize) {
    errors.push(`ขนาดไฟล์เกิน ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
  }
  
  if (file.size === 0) {
    errors.push('ไฟล์ว่างเปล่า');
  }
  
  // MIME type check
  const validMimeTypes = allowedConfigs.flatMap(config => config.mimeTypes);
  if (!validMimeTypes.includes(file.type)) {
    errors.push(`ประเภทไฟล์ไม่ถูกต้อง: ${file.type || 'ไม่ระบุ'}`);
  }
  
  // Extension check
  const validExtensions = allowedConfigs.flatMap(config => config.extensions);
  if (!validateExtension(file.name, validExtensions)) {
    errors.push(`นามสกุลไฟล์ไม่ถูกต้องหรือไม่ปลอดภัย: ${file.name.split('.').pop()}`);
  }
  
  // Filename sanitization warning
  const sanitizedFilename = sanitizeFilename(file.name);
  if (sanitizedFilename !== file.name) {
    warnings.push(`ชื่อไฟล์ถูกปรับให้ปลอดภัย: ${sanitizedFilename}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
