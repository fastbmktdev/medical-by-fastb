import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return false;
    }
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidAnonKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  return key.length > 20 && !key.includes('your-') && !key.includes('placeholder');
}

function isPlaceholderValue(value: string): boolean {
  const placeholders = [
    'your-project-url',
    'your-anon-key',
    'placeholder',
    'https://placeholder.supabase.co',
  ];
  return placeholders.some(placeholder => value.includes(placeholder));
}

function secureLog(level: 'warn' | 'error', message: string, data?: unknown) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    if (level === 'error') {
      console.error(`[Middleware] ${message}`, data);
    } else {
      console.warn(`[Middleware] ${message}`, data);
    }
  } else {
    if (level === 'error') {
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseAnonKey) {
    secureLog('warn', 'Supabase not configured - skipping authentication');
    return supabaseResponse;
  }
  if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) {
    secureLog('warn', 'Supabase using placeholder values - skipping authentication');
    return supabaseResponse;
  }
  if (!isValidSupabaseUrl(supabaseUrl)) {
    secureLog('error', 'Invalid Supabase URL format');
    return supabaseResponse;
  }
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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          },
        },
      }
    )
    const { error } = await supabase.auth.getUser()
    if (error) {
      const errorType = error.name || 'AuthError';
      secureLog('error', `Supabase auth error: ${errorType}`,
        process.env.NODE_ENV === 'development' ? { message: error.message } : undefined
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    secureLog('error', 'Failed to connect to Supabase',
      process.env.NODE_ENV === 'development'
        ? { error: errorMessage, path: request.nextUrl.pathname }
        : { path: request.nextUrl.pathname }
    );
  }
  return supabaseResponse
}
