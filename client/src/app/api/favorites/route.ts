/**
 * Favorites API Route - Proxy to Express Server
 * 
 * This route proxies requests to the Express API server
 * to maintain a consistent API structure for the client.
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
  path: string
): Promise<NextResponse> {
  try {
    const apiServerUrl = getApiServerUrl();
    const url = new URL(path, apiServerUrl);
    
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
    
    // Make request to Express server
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });
    
    // Get response body
    const responseText = await response.text();
    
    // Forward response with same status and headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Exclude headers that shouldn't be forwarded
      if (
        key.toLowerCase() !== 'content-encoding' &&
        key.toLowerCase() !== 'transfer-encoding' &&
        key.toLowerCase() !== 'connection'
      ) {
        responseHeaders.set(key, value);
      }
    });
    
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Favorites API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to API server',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/api/favorites');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/api/favorites');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, '/api/favorites');
}

