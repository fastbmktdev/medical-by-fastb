/**
 * Gamification API Dynamic Routes - Proxy to Express Server
 * 
 * This route handles dynamic gamification routes like:
 * - /api/gamification/stats
 * - /api/gamification/dashboard
 * - /api/gamification/badges
 * - /api/gamification/challenges
 * - /api/gamification/leaderboards
 * - /api/gamification/points
 * - /api/gamification/streaks
 * etc.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get the API server base URL from environment variables
 */
function getApiServerUrl(): string {
  // In production, use the API server URL from env
  // In development, default to localhost:3001
  if (process.env.API_SERVER_URL) {
    return process.env.API_SERVER_URL;
  }
  
  // For Vercel deployments, construct from VERCEL_URL if available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to local development server
  const port = process.env.API_PORT || '3001';
  return `http://localhost:${port}`;
}

/**
 * Proxy request to Express API server
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  try {
    const apiServerUrl = getApiServerUrl();
    
    // Build the target path
    const targetPath = `/api/gamification/${pathSegments.join('/')}`;
    const url = new URL(targetPath, apiServerUrl);
    
    // Copy query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    // Prepare headers
    const headers = new Headers();
    
    // Copy relevant headers from the original request
    const forwardedHeaders = [
      'authorization',
      'content-type',
      'accept',
      'accept-language',
      'cookie',
    ];
    
    forwardedHeaders.forEach((headerName) => {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        headers.set(headerName, headerValue);
      }
    });
    
    // Add forwarded headers for proper request tracking
    headers.set('x-forwarded-for', request.headers.get('x-forwarded-for') || '');
    headers.set('x-forwarded-proto', request.headers.get('x-forwarded-proto') || 'http');
    headers.set('x-forwarded-host', request.headers.get('host') || '');
    
    // Get request body if present
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // No body or body already consumed
        body = undefined;
      }
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Make request to Express server
      const response = await fetch(url.toString(), {
        method: request.method,
        headers,
        body,
        // Forward credentials for cookie-based auth
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Get response body
      let responseBody: string;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // For JSON responses, parse and re-stringify to ensure valid JSON
        const json = await response.json();
        responseBody = JSON.stringify(json);
      } else {
        responseBody = await response.text();
      }
      
      // Create Next.js response with same status and headers
      const nextResponse = new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
      });
      
      // Copy response headers (excluding some that Next.js handles)
      const excludedHeaders = ['content-encoding', 'transfer-encoding', 'connection'];
      response.headers.forEach((value, key) => {
        if (!excludedHeaders.includes(key.toLowerCase())) {
          nextResponse.headers.set(key, value);
        }
      });
      
      return nextResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error proxying gamification request to API server:', error);
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'การเชื่อมต่อกับเซิร์ฟเวอร์ API หมดเวลา กรุณาลองใหม่อีกครั้ง',
        },
        { status: 504 }
      );
    }
    
    // Handle network errors
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ API ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่',
          message: process.env.NODE_ENV === 'development' 
            ? `API Server URL: ${getApiServerUrl()}`
            : undefined,
        },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ API ได้',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 502 }
    );
  }
}

/**
 * GET /api/gamification/[...path]
 * Handle all GET requests to gamification API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * POST /api/gamification/[...path]
 * Handle all POST requests to gamification API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * PUT /api/gamification/[...path]
 * Handle all PUT requests to gamification API
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * DELETE /api/gamification/[...path]
 * Handle all DELETE requests to gamification API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * PATCH /api/gamification/[...path]
 * Handle all PATCH requests to gamification API
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

