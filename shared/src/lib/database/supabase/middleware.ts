import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Validates Supabase URL format
 * @param url - Supabase project URL
 * @returns true if URL is valid, false otherwise
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Must be HTTPS in production
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return false;
    }
    // Must be a valid URL
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates Supabase anon key format (basic check)
 * @param key - Supabase anon key
 * @returns true if key format looks valid, false otherwise
 */
function isValidAnonKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  // Anon keys are typically JWT tokens, should be reasonably long
  return key.length > 20 && !key.includes('your-') && !key.includes('placeholder');
}

/**
 * Checks if environment variables are placeholder values
 */
function isPlaceholderValue(value: string): boolean {
  const placeholders = [
    'your-project-url',
    'your-anon-key',
    'placeholder',
    'https://placeholder.supabase.co',
  ];
  return placeholders.some(placeholder => value.includes(placeholder));
}

/**
 * Secure logging - only logs in development, sanitizes in production
 */
function secureLog(level: 'warn' | 'error', message: string, data?: unknown) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    if (level === 'error') {
      console.error(`[Middleware] ${message}`, data);
    } else {
      console.warn(`[Middleware] ${message}`, data);
    }
  } else {
    // In production, only log generic messages without sensitive data
    // Use structured logging service (e.g., Sentry) instead of console
    if (level === 'error') {
      // In production, log to monitoring service instead
      // Example: logger.error(message, { sanitized: true })
    }
  }
}

/**
 * Updates the Supabase session in middleware
 * This function handles authentication state management securely
 * 
 * Security considerations:
 * - Validates environment variables before use
 * - Prevents information leakage in error messages
 * - Handles errors gracefully without blocking requests
 * - Uses secure cookie handling via Supabase SSR
 * 
 * @param request - Next.js request object
 * @returns NextResponse with updated session cookies
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  
  // Use local URL first for self-hosting, fallback to regular or public env vars
  // Middleware can access both NEXT_PUBLIC_ and regular env vars
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  // Security: Validate environment variables before use
  if (!supabaseUrl || !supabaseAnonKey) {
    secureLog('warn', 'Supabase not configured - skipping authentication');
    return supabaseResponse;
  }

  // Security: Check for placeholder values
  if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) {
    secureLog('warn', 'Supabase using placeholder values - skipping authentication');
    return supabaseResponse;
  }

  // Security: Validate URL format
  if (!isValidSupabaseUrl(supabaseUrl)) {
    secureLog('error', 'Invalid Supabase URL format');
    return supabaseResponse;
  }

  // Security: Basic anon key validation
  if (!isValidAnonKey(supabaseAnonKey)) {
    secureLog('error', 'Invalid Supabase anon key format');
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            // Supabase SSR automatically sets secure cookie options:
            // - httpOnly: true (prevents XSS)
            // - secure: true in production (HTTPS only)
            // - sameSite: 'lax' (CSRF protection)
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const { error } = await supabase.auth.getUser()
    
    if (error) {
      // Security: Don't leak error details in production
      // Only log error type, not full message
      const errorType = error.name || 'AuthError';
      secureLog('error', `Supabase auth error: ${errorType}`, 
        process.env.NODE_ENV === 'development' ? { message: error.message } : undefined
      );
      // Continue anyway - don't block the request
      // This allows public pages to load even if auth fails
    }

  } catch (error) {
    // Security: Handle errors without leaking sensitive information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // In production, only log generic error
    secureLog('error', 'Failed to connect to Supabase', 
      process.env.NODE_ENV === 'development' 
        ? { error: errorMessage, path: request.nextUrl.pathname }
        : { path: request.nextUrl.pathname }
    );
    
    // Don't block the request - allow the app to continue
    // Users just won't be authenticated, but public pages will still work
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

