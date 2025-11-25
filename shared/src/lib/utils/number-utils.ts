/**
 * Number Utilities
 * Common number formatting and generation utilities
 */

/**
 * Round number to 2 decimal places (for currency)
 * @param value - Number to round
 * @returns  number with 2 decimal places
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Sanitize price value (round to 2 decimals, ensure non-negative)
 * @param value - Price value to sanitize
 * @param fallback - Fallback value if invalid (default: 0)
 * @returns Sanitized price value
 */
export function sanitizePrice(value: number | string | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return fallback;
  }

  return Math.max(0, roundToTwoDecimals(numValue));
}

/**
 * Format date components for number generation
 * @param date - Date object (default: current date)
 * @returns Object with formatted date components
 */
export function formatDateComponents(date: Date = new Date()) {
  return {
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    timestamp: date.getTime().toString(),
  };
}

/**
 * Generate a unique number with prefix and date
 * @param prefix - Prefix for the number (e.g., 'BK', 'ORD')
 * @param options - Generation options
 * @returns Generated number string
 */
export function generateNumberWithPrefix(
  prefix: string,
  options?: {
    includeDate?: boolean;
    timestampLength?: number;
    randomLength?: number;
    separator?: string;
  }
): string {
  const {
    includeDate = true,
    timestampLength = 4,
    randomLength = 0,
    separator = '',
  } = options || {};

  const { year, month, day, timestamp } = formatDateComponents();

  let number = prefix;

  if (includeDate) {
    number += `${year}${month}${day}`;
  }

  // Add timestamp suffix
  if (timestampLength > 0) {
    const timestampSuffix = timestamp.slice(-timestampLength);
    number += separator + timestampSuffix;
  }

  // Add random component if needed
  if (randomLength > 0) {
    const random = Math.floor(Math.random() * Math.pow(10, randomLength))
      .toString()
      .padStart(randomLength, '0');
    number += separator + random;
  }

  return number;
}

