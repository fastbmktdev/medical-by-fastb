/**
 * Partner API Dynamic Routes - Proxy to Express Server
 * 
 * This route handles dynamic partner routes like:
 * - /api/partner/id-card
 * - /api/partner/analytics
 * - /api/partner/performance-metrics
 * - /api/partner/packages
 * - /api/partner/reviews
 * - /api/partner/conversations
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
  const apiServerUrl = getApiServerUrl();
  const targetPath = `/api/partner/${pathSegments.join('/')}`;
  const url = new URL(targetPath, apiServerUrl);
  const isFileUpload = request.headers.get('content-type')?.includes('multipart/form-data');
  
  // Log request details for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Proxy] ${request.method} ${targetPath} -> ${url.toString()}`);
    if (isFileUpload) {
      console.log('[Proxy] File upload detected');
    }
  }
  
  try {
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
    // For FormData (file uploads), we need to handle it specially
    let body: BodyInit | undefined;
    const contentType = request.headers.get('content-type');
    
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType?.includes('multipart/form-data')) {
        try {
          // For FormData, use formData() to preserve binary data
          const formData = await request.formData();
          body = formData;
          // Don't set content-type header - fetch will set it with boundary automatically
          headers.delete('content-type');
        } catch (formDataError) {
          console.error('[Proxy] Failed to parse FormData:', formDataError);
          return NextResponse.json(
            {
              success: false,
              error: 'ไม่สามารถประมวลผลไฟล์ได้ กรุณาลองใหม่อีกครั้ง',
              details: process.env.NODE_ENV === 'development' 
                ? (formDataError instanceof Error ? formDataError.message : String(formDataError))
                : undefined,
            },
            { status: 400 }
          );
        }
      } else {
        try {
          // For other content types, try to get as text or arrayBuffer
          if (contentType?.includes('application/json')) {
            body = await request.text();
          } else {
            // For binary data, use arrayBuffer
            const arrayBuffer = await request.arrayBuffer();
            body = arrayBuffer;
          }
        } catch (bodyError) {
          // No body or body already consumed
          console.warn('[Proxy] Could not read request body:', bodyError);
          body = undefined;
        }
      }
    }
    
    // Create abort controller for timeout
    // Use longer timeout for file uploads (90 seconds)
    const timeoutDuration = isFileUpload ? 90000 : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[Proxy] Request timeout after ${timeoutDuration}ms: ${targetPath}`);
      controller.abort();
    }, timeoutDuration);
    
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
      
      // Handle non-OK responses with better error messages
      if (!response.ok) {
        const responseContentType = response.headers.get('content-type');
        let errorData: any = { success: false, error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' };
        
        try {
          if (responseContentType?.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = {
              success: false,
              error: `เซิร์ฟเวอร์ส่งคืนข้อผิดพลาด (${response.status} ${response.statusText})`,
              details: process.env.NODE_ENV === 'development' ? text.substring(0, 200) : undefined,
            };
          }
        } catch (parseError) {
          console.error('[Proxy] Failed to parse error response:', parseError);
          errorData = {
            success: false,
            error: `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${response.status} ${response.statusText})`,
          };
        }
        
        // Log error details for debugging
        console.error(`[Proxy] API server returned error:`, {
          status: response.status,
          statusText: response.statusText,
          path: targetPath,
          error: errorData.error,
        });
        
        return NextResponse.json(errorData, { status: response.status });
      }
      
      // Get response body
      let responseBody: string;
      const responseContentType = response.headers.get('content-type');
      if (responseContentType?.includes('application/json')) {
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // Enhanced error logging with context
    const errorContext = {
      method: request.method,
      path: targetPath,
      apiServerUrl,
      isFileUpload,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    
    console.error('[Proxy] Error proxying partner request to API server:', errorContext);
    
    // Handle timeout errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'การเชื่อมต่อกับเซิร์ฟเวอร์ API หมดเวลา กรุณาลองใหม่อีกครั้ง',
          details: isFileUpload 
            ? 'การอัปโหลดไฟล์ใช้เวลานานเกินไป กรุณาลองอัปโหลดไฟล์ที่มีขนาดเล็กลง'
            : undefined,
        },
        { status: 504 }
      );
    }
    
    // Handle network/connection errors
    if (error instanceof Error && (
      error.message.includes('fetch') || 
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('network') ||
      error.name === 'TypeError'
    )) {
      const diagnosticInfo = process.env.NODE_ENV === 'development' 
        ? {
            apiServerUrl,
            targetPath,
            error: error.message,
          }
        : undefined;
      
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ API ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่',
          message: diagnosticInfo,
        },
        { status: 502 }
      );
    }
    
    // Handle FormData-specific errors
    if (error instanceof Error && (
      error.message.includes('FormData') ||
      error.message.includes('multipart')
    )) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถประมวลผลไฟล์ได้ กรุณาตรวจสอบว่าไฟล์ถูกต้องและลองใหม่อีกครั้ง',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 400 }
      );
    }
    
    // Generic error handler
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ API ได้',
        message: process.env.NODE_ENV === 'development' 
          ? {
              error: error instanceof Error ? error.message : String(error),
              apiServerUrl,
              targetPath,
            }
          : undefined,
      },
      { status: 502 }
    );
  }
}

/**
 * GET /api/partner/[...path]
 * Handle all GET requests to partner API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * POST /api/partner/[...path]
 * Handle all POST requests to partner API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * PUT /api/partner/[...path]
 * Handle all PUT requests to partner API
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * DELETE /api/partner/[...path]
 * Handle all DELETE requests to partner API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

/**
 * PATCH /api/partner/[...path]
 * Handle all PATCH requests to partner API
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

