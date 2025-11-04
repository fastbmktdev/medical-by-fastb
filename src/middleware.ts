import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/database/supabase/middleware'
import { rateLimit, getRateLimitConfig } from '@/lib/middleware/rate-limit'
import { csrfProtection } from '@/lib/middleware/csrf-protection'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Apply CSRF protection and rate limiting to API routes
  if (path.startsWith('/api/')) {
    // Skip protection for webhooks (they have their own authentication/signature verification)
    if (path.startsWith('/api/webhooks/')) {
      return await updateSession(request)
    }

    // Apply CSRF protection first (before rate limiting)
    const csrfResponse = await csrfProtection(request)
    if (csrfResponse) {
      return csrfResponse
    }

    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }

  // Continue with Supabase session update
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

