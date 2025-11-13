import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy Auth Callback Route Handler
 * 
 * This route redirects to /api/auth/callback for backwards compatibility.
 * The /api/auth/callback route is the correct path as it bypasses i18n middleware.
 * 
 * @deprecated Use /api/auth/callback instead
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');
  
  // Build the API callback URL
  const apiCallbackUrl = new URL('/api/auth/callback', request.url);
  
  // Preserve all query parameters
  if (code) apiCallbackUrl.searchParams.set('code', code);
  if (next) apiCallbackUrl.searchParams.set('next', next);
  if (type) apiCallbackUrl.searchParams.set('type', type);
  
  // Copy any other query parameters
  requestUrl.searchParams.forEach((value, key) => {
    if (!['code', 'next', 'type'].includes(key)) {
      apiCallbackUrl.searchParams.set(key, value);
    }
  });
  
  // Redirect to API callback route
  return NextResponse.redirect(apiCallbackUrl);
}
