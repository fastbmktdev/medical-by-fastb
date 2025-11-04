/**
 * CSRF Protection Middleware
 * 
 * Protects API routes from Cross-Site Request Forgery (CSRF) attacks
 * by validating Origin and Referer headers.
 * 
 * Methods:
 * - Origin header validation (primary)
 * - Referer header validation (fallback)
 * - SameSite cookie enforcement (via Supabase config)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get allowed origins for CSRF protection
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Add production domain
  const productionDomain = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (productionDomain) {
    const url = productionDomain.startsWith('http') 
      ? productionDomain 
      : `https://${productionDomain}`;
    origins.push(url);
  }

  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://localhost:3001');
    origins.push('http://127.0.0.1:3001');
  }

  // Add custom allowed origins from environment
  const customOrigins = process.env.CSRF_ALLOWED_ORIGINS;
  if (customOrigins) {
    origins.push(...customOrigins.split(',').map(origin => origin.trim()));
  }

  return origins;
}

/**
 * Extract origin from request
 */
function getOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (origin) {
    return origin.toLowerCase();
  }

  // Fallback to Referer header
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin.toLowerCase();
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validate origin against allowed origins
 */
function isValidOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) {
    return false;
  }

  return allowedOrigins.some(allowed => {
    const normalizedAllowed = allowed.toLowerCase();
    return origin === normalizedAllowed || origin.startsWith(normalizedAllowed);
  });
}

/**
 * Check if request should bypass CSRF protection
 */
function shouldBypassCSRF(path: string, method: string): boolean {
  // Skip CSRF protection for:
  // - GET requests (read-only)
  // - HEAD requests
  // - OPTIONS requests (CORS preflight)
  // - Webhooks (they have their own signature verification)
  // - Public health check endpoints
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  if (path.startsWith('/api/webhooks/')) {
    return true;
  }

  if (path.startsWith('/api/cron/')) {
    return true;
  }

  if (path === '/api/health') {
    return true;
  }

  // Skip for static assets
  if (path.startsWith('/_next/') || path.startsWith('/api/_next/')) {
    return true;
  }

  return false;
}

/**
 * CSRF Protection Middleware
 * 
 * Validates that requests come from allowed origins
 * 
 * Usage:
 * ```ts
 * import { csrfProtection } from '@/lib/middleware/csrf-protection';
 * 
 * export async function POST(request: NextRequest) {
 *   const csrfResponse = await csrfProtection(request);
 *   if (csrfResponse) {
 *     return csrfResponse; // CSRF validation failed
 *   }
 *   // Continue with your handler
 * }
 * ```
 */
export async function csrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF protection if disabled
  if (process.env.DISABLE_CSRF_PROTECTION === 'true') {
    return null;
  }

  const path = request.nextUrl.pathname;
  const method = request.method;

  // Skip CSRF protection for certain requests
  if (shouldBypassCSRF(path, method)) {
    return null;
  }

  // Get allowed origins
  const allowedOrigins = getAllowedOrigins();

  // If no allowed origins configured, log warning but allow request
  // (should not happen in production)
  if (allowedOrigins.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSRF] No allowed origins configured. CSRF protection disabled.');
    }
    return null;
  }

  // Get and validate origin
  const origin = getOrigin(request);

  if (!isValidOrigin(origin, allowedOrigins)) {
    // Log CSRF attempt
    console.warn('[CSRF] Blocked request from invalid origin:', {
      origin,
      path,
      method,
      allowedOrigins,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request origin. This request has been blocked for security reasons.',
        code: 'CSRF_ERROR',
      },
      {
        status: 403,
        headers: {
          'X-CSRF-Protection': 'blocked',
        },
      }
    );
  }

  // CSRF validation passed
  return null;
}

/**
 * CSRF Protection wrapper for API route handlers
 * 
 * Usage:
 * ```ts
 * import { withCSRFProtection } from '@/lib/middleware/csrf-protection';
 * 
 * export const POST = withCSRFProtection(async (request: NextRequest) => {
 *   // Your handler code
 * });
 * ```
 */
export function withCSRFProtection<T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (request: NextRequest, ...args: unknown[]) => {
    // Check CSRF protection
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Execute handler
    return handler(request, ...args);
  }) as T;
}

/**
 * Get CSRF token for client-side use
 * This generates a token that can be included in requests
 * 
 * Note: For Next.js, we primarily rely on SameSite cookies and Origin validation
 * This function is optional and can be used for additional protection
 */
export function generateCSRFToken(): string {
  // Generate a random token
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token (if using token-based protection)
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple comparison - in production, use secure comparison
  return token === sessionToken;
}

