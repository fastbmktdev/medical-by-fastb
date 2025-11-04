/**
 * Rate Limit Utility Functions
 * 
 * Helper functions for adding rate limit headers to responses
 */

import { NextResponse } from 'next/server';

interface RateLimitHeaders {
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  headers: RateLimitHeaders
): NextResponse {
  const resetDate = new Date(headers.resetAt);
  const retryAfter = Math.ceil((headers.resetAt - Date.now()) / 1000);

  response.headers.set('X-RateLimit-Limit', headers.limit.toString());
  response.headers.set('X-RateLimit-Remaining', headers.remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetDate.toISOString());
  response.headers.set('Retry-After', retryAfter.toString());

  return response;
}

/**
 * Create a rate limit exceeded response
 */
export function createRateLimitResponse(
  message: string,
  limit: number,
  resetAt: number
): NextResponse {
  const resetDate = new Date(resetAt);
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      success: false,
      error: message,
      retryAfter,
      resetAt: resetDate.toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetDate.toISOString(),
      },
    }
  );
}

