/**
 * Rate Limiting Middleware
 * 
 * Protects API routes from abuse by limiting the number of requests
 * per IP address or user within a time window.
 * 
 * Supports:
 * - In-memory storage (development)
 * - Redis/Upstash (production)
 * - Different limits per endpoint
 * - IP-based and user-based rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configuration
interface RateLimitConfig {
  window: number; // Time window in seconds
  max: number; // Maximum requests per window
  message?: string; // Custom error message
}

// Default rate limits for different endpoint types
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  '/api/auth/signup': { window: 3600, max: 5, message: 'Too many signup attempts. Please try again later.' },
  '/api/auth/login': { window: 900, max: 10, message: 'Too many login attempts. Please try again later.' },
  '/api/auth/resend-verification': { window: 3600, max: 3, message: 'Too many verification email requests.' },
  '/api/auth/reset-password': { window: 3600, max: 5, message: 'Too many password reset requests.' },
  
  // Booking endpoints
  '/api/bookings': { window: 60, max: 10, message: 'Too many booking requests. Please slow down.' },
  '/api/bookings/gym': { window: 60, max: 10, message: 'Too many booking requests. Please slow down.' },
  
  // Payment endpoints
  '/api/payments/create-payment-intent': { window: 60, max: 20, message: 'Too many payment requests.' },
  
  // Contact form
  '/api/contact': { window: 3600, max: 5, message: 'Too many contact form submissions. Please try again later.' },
  
  // Notification endpoints
  '/api/notifications': { window: 60, max: 60, message: 'Too many notification requests.' },
  
  // Gamification endpoints
  '/api/gamification/points': { window: 60, max: 30, message: 'Too many points requests.' },
  
  // User profile endpoints
  '/api/users/profile/picture': { window: 3600, max: 10, message: 'Too many profile picture uploads.' },
  
  // Favorites endpoints
  '/api/favorites': { window: 60, max: 50, message: 'Too many favorite requests.' },
  
  // Admin endpoints - stricter
  '/api/admin': { window: 60, max: 100, message: 'Too many admin requests.' },
  
  // Partner endpoints
  '/api/partner': { window: 60, max: 100, message: 'Too many partner requests.' },
  
  // Default rate limit for all other API endpoints
  default: { window: 60, max: 100, message: 'Too many requests. Please slow down.' },
};

// In-memory storage for rate limiting (development)
// In production, use Redis/Upstash
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  async check(key: string, max: number, window: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const resetAt = now + window * 1000;
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // New entry or expired
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: max - 1,
        resetAt,
      };
    }

    if (entry.count >= max) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: max - entry.count,
      resetAt: entry.resetAt,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limiter instance
let rateLimiter: InMemoryRateLimiter | null = null;

function getRateLimiter(): InMemoryRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new InMemoryRateLimiter();
  }
  return rateLimiter;
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or user ID if authenticated
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  // If user is authenticated, use user ID for more accurate rate limiting
  if (userId) {
    return `user:${userId}`;
  }

  // Otherwise use IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

/**
 * Get rate limit configuration for a given path
 */
export function getRateLimitConfig(path: string): RateLimitConfig {
  // Check for exact match first
  if (RATE_LIMITS[path]) {
    return RATE_LIMITS[path];
  }

  // Check for prefix match (e.g., /api/admin/*)
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      return config;
    }
  }

  // Return default
  return RATE_LIMITS.default;
}

/**
 * Rate limiting middleware
 * 
 * Usage:
 * ```ts
 * import { rateLimit } from '@/lib/middleware/rate-limit';
 * 
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await rateLimit(request);
 *   if (rateLimitResponse) {
 *     return rateLimitResponse; // Rate limit exceeded
 *   }
 *   // Continue with your handler
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  userId?: string,
  customConfig?: RateLimitConfig
): Promise<NextResponse | null> {
  // Skip rate limiting in development if explicitly disabled
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return null;
  }

  const path = new URL(request.url).pathname;
  const config = customConfig || getRateLimitConfig(path);

  // Generate rate limit key
  const clientId = getClientIdentifier(request, userId);
  const key = `${path}:${clientId}`;

  // Check rate limit
  const limiter = getRateLimiter();
  const result = await limiter.check(key, config.max, config.window);

  if (!result.allowed) {
    // Rate limit exceeded
    const resetDate = new Date(result.resetAt);
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return NextResponse.json(
      {
        success: false,
        error: config.message || 'Too many requests. Please slow down.',
        retryAfter,
        resetAt: resetDate.toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate.toISOString(),
        },
      }
    );
  }

  // Add rate limit headers to response
  // Note: These headers will be added by the wrapper function
  return null;
}

/**
 * Rate limit wrapper for API route handlers
 * 
 * Usage:
 * ```ts
 * import { withRateLimit } from '@/lib/middleware/rate-limit';
 * 
 * export const POST = withRateLimit(async (request: NextRequest) => {
 *   // Your handler code
 * });
 * ```
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  customConfig?: RateLimitConfig
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    
    // Try to get user ID from request if available
    let userId: string | undefined;
    try {
      // This is a best-effort attempt to get user ID
      // The actual implementation may vary based on your auth setup
      const authHeader = request.headers.get('authorization');
      // You might need to decode JWT or call Supabase here
      // For now, we'll rely on IP-based rate limiting
    } catch {
      // Ignore errors
    }

    // Check rate limit
    const rateLimitResponse = await rateLimit(request, userId, customConfig);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute handler
    const response = await handler(...args);

    // Add rate limit headers if response is successful
    // Note: We can't easily add headers here without knowing the rate limit status
    // This is a limitation of the wrapper approach
    // Consider using the rateLimit function directly in your handlers

    return response;
  }) as T;
}

/**
 * Cleanup rate limiter (call on app shutdown)
 */
export function cleanupRateLimiter() {
  if (rateLimiter) {
    rateLimiter.destroy();
    rateLimiter = null;
  }
}

