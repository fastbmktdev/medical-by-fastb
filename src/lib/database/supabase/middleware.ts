import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // If Supabase is not configured or using placeholder values, skip auth
  if (!supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl === 'your-project-url' ||
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseAnonKey === 'your-anon-key' ||
      supabaseAnonKey === 'placeholder-anon-key') {
    console.warn('[Middleware] Supabase not configured - skipping authentication');
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
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
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
      console.error('[Middleware] Supabase auth error:', error.message);
      // Continue anyway - don't block the request
    }

  } catch (error) {
    // Handle network errors, connection failures, etc.
    console.error('[Middleware] Failed to connect to Supabase:', error);
    
    // Log helpful debugging information
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Debug info:');
      console.error('  - Supabase URL:', supabaseUrl);
      console.error('  - Is Supabase running? Run: supabase status');
    }
    
    // Don't block the request - allow the app to continue
    // Users just won't be authenticated
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

