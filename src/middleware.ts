import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/database/supabase/middleware';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { csrfProtection } from '@/lib/middleware/csrf-protection';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Constants
const DEFAULT_LOCALE = 'th';
const LOCALE_PREFIX = 'always';
const COMING_SOON_HOSTS = ['thaikickmuaythai.com', 'www.thaikickmuaythai.com'];
const AUTH_LOCALE_REGEX = /^\/(th|en|jp)\/auth\/callback(\/|$)/;
const STATIC_EXTENSIONS_REGEX = /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|eot)$/;

// Setup i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: LOCALE_PREFIX,
});

function isApiRoute(path: string) {
  return path.startsWith('/api/');
}

function isApiExemptFromProtection(path: string) {
  return path.startsWith('/api/webhooks/') || path.startsWith('/api/cron/');
}

function shouldSkipI18n(path: string) {
  return (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/_vercel/') ||
    path.startsWith('/assets/') ||
    STATIC_EXTENSIONS_REGEX.test(path)
  );
}

function isComingSoonPath(path: string) {
  return (
    path === '/coming-soon' ||
    locales.some((locale) => path === `/${locale}/coming-soon`)
  );
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const path = request.nextUrl.pathname;

  // Handle locale-aware auth callback redirection
  if (AUTH_LOCALE_REGEX.test(path)) {
    const apiCallbackUrl = new URL('/api/auth/callback', request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      apiCallbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(apiCallbackUrl);
  }

  // Redirect specific hosts to the coming soon page if necessary
  if (COMING_SOON_HOSTS.includes(host) && !isComingSoonPath(path)) {
    const comingSoonUrl = new URL(`/${locales[0]}/coming-soon`, request.url);
    return NextResponse.redirect(comingSoonUrl);
  }

  // API route: apply special protections
  if (isApiRoute(path)) {
    if (isApiExemptFromProtection(path)) {
      return updateSession(request);
    }
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) return csrfResponse;

    const rateLimitResponse = await rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // i18n middleware only for relevant routes
  if (!shouldSkipI18n(path)) {
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;
  }

  // Always update session at the end
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|eot|css|js|ico)$).*)',
  ],
};
