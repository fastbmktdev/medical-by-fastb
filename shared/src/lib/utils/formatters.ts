/**
 * Format date to Thai locale string
 * @param dateString - ISO date string or Date object
 * @param options - Optional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options?: {
    includeTime?: boolean;
    locale?: string;
  }
): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDate:', dateString);
      return 'วันที่ไม่ถูกต้อง';
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    if (options?.includeTime !== false) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
    }

    return date.toLocaleDateString(options?.locale || 'th-TH', formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'วันที่ไม่ถูกต้อง';
  }
}

/**
 * Format phone number to Thai format
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone || '';
  }

  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}
