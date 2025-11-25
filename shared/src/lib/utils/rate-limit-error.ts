/**
 * Rate Limit Error Utilities
 * 
 * Helper functions for handling HTTP 429 (Rate Limit) errors
 */

export interface RateLimitError {
  isRateLimited: boolean;
  retryAfter?: number;
  resetAt?: string;
  message: string;
}

/**
 * Check if a response is a rate limit error
 */
export async function checkRateLimitError(
  response: Response
): Promise<RateLimitError | null> {
  if (response.status === 429) {
    try {
      const data = await response.json();
      const retryAfter = parseInt(
        response.headers.get('Retry-After') || '0'
      );
      const resetAt = response.headers.get('X-RateLimit-Reset') || undefined;

      return {
        isRateLimited: true,
        retryAfter,
        resetAt,
        message:
          data.error ||
          'Too many requests. Please try again later.',
      };
    } catch {
      // If JSON parsing fails, return default error
      return {
        isRateLimited: true,
        retryAfter: 60,
        message: 'Too many requests. Please try again later.',
      };
    }
  }

  return null;
}

/**
 * Format rate limit error message with retry time
 */
export function formatRateLimitMessage(
  rateLimitError: RateLimitError
): string {
  if (rateLimitError.retryAfter) {
    const minutes = Math.floor(rateLimitError.retryAfter / 60);
    const seconds = rateLimitError.retryAfter % 60;

    if (minutes > 0) {
      return `${rateLimitError.message} Please wait ${minutes} minute${minutes > 1 ? 's' : ''}${seconds > 0 ? ` and ${seconds} second${seconds > 1 ? 's' : ''}` : ''}.`;
    }

    return `${rateLimitError.message} Please wait ${seconds} second${seconds > 1 ? 's' : ''}.`;
  }

  if (rateLimitError.resetAt) {
    const resetDate = new Date(rateLimitError.resetAt);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    const diffSeconds = Math.ceil(diffMs / 1000);

    if (diffSeconds > 0) {
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;

      if (minutes > 0) {
        return `${rateLimitError.message} Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}${seconds > 0 ? ` and ${seconds} second${seconds > 1 ? 's' : ''}` : ''}.`;
      }

      return `${rateLimitError.message} Please try again in ${seconds} second${seconds > 1 ? 's' : ''}.`;
    }
  }

  return rateLimitError.message;
}

/**
 * Handle rate limit error in Thai language
 */
export function formatRateLimitMessageThai(
  rateLimitError: RateLimitError
): string {
  if (rateLimitError.retryAfter) {
    const minutes = Math.floor(rateLimitError.retryAfter / 60);
    const seconds = rateLimitError.retryAfter % 60;

    if (minutes > 0) {
      return `${rateLimitError.message} กรุณารอ ${minutes} นาที${seconds > 0 ? ` ${seconds} วินาที` : ''} แล้วลองใหม่อีกครั้ง`;
    }

    return `${rateLimitError.message} กรุณารอ ${seconds} วินาที แล้วลองใหม่อีกครั้ง`;
  }

  if (rateLimitError.resetAt) {
    const resetDate = new Date(rateLimitError.resetAt);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    const diffSeconds = Math.ceil(diffMs / 1000);

    if (diffSeconds > 0) {
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;

      if (minutes > 0) {
        return `${rateLimitError.message} กรุณาลองใหม่อีกครั้งใน ${minutes} นาที${seconds > 0 ? ` ${seconds} วินาที` : ''}`;
      }

      return `${rateLimitError.message} กรุณาลองใหม่อีกครั้งใน ${seconds} วินาที`;
    }
  }

  return rateLimitError.message || 'มีการส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง';
}

/**
 * Wrapper for fetch that handles rate limit errors
 */
export async function fetchWithRateLimit(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const rateLimitError = await checkRateLimitError(response);
    if (rateLimitError) {
      throw new Error(formatRateLimitMessageThai(rateLimitError));
    }
  }

  return response;
}

