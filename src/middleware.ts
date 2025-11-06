import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/database/supabase/middleware'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { csrfProtection } from '@/lib/middleware/csrf-protection'
import createIntlMiddleware from 'next-intl/middleware'
import { locales } from './i18n'

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales: locales,
  defaultLocale: 'th',
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip i18n middleware for API routes, static files, and internal Next.js routes
  const shouldSkipI18n =
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/_vercel/') ||
    path.startsWith('/assets/') || // Skip all assets directory
    path.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|eot)$/)

  // Apply CSRF protection and rate limiting to API routes
  if (path.startsWith('/api/')) {
    // Skip protection for webhooks (they have their own authentication/signature verification)
    if (path.startsWith('/api/webhooks/')) {
      return await updateSession(request)
    }
    // Skip protection for cron jobs (they have their own secret authentication)
    if (path.startsWith('/api/cron/')) {
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

  // Apply i18n middleware for non-API routes
  if (!shouldSkipI18n) {
    const intlResponse = intlMiddleware(request)

    // If i18n middleware wants to redirect, do it
    if (intlResponse) {
      return intlResponse
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
     * - assets/ (static assets directory)
     * - Common static file extensions (images, videos, audio, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|eot|css|js|ico)$).*)',
  ],
}

