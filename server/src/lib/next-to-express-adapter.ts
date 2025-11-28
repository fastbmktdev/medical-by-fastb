/**
 * Next.js to Express Adapter
 * 
 * Converts Next.js API route handlers (NextRequest/NextResponse) to Express route handlers
 */

import { Request, Response, NextFunction } from 'express';
import { NextRequest, NextResponse } from 'next/server';
import busboy from 'busboy';

/**
 * Convert Express Request to NextRequest-like object
 */
function createNextRequest(req: Request): NextRequest {
  // Build full URL
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost';
  const url = `${protocol}://${host}${req.originalUrl || req.url}`;
  
  // Create a mock NextRequest object
  // Note: This is a simplified adapter - full NextRequest has more features
  const nextRequest = {
    url,
    method: req.method,
    headers: new Headers(),
    cookies: {
      get: (name: string) => {
        // Handle case where cookies might not be parsed (no cookie-parser middleware)
        const cookies = req.cookies || {};
        const value = cookies[name];
        return value ? { name, value } : undefined;
      },
      getAll: () => {
        const cookies = req.cookies || {};
        return Object.entries(cookies).map(([name, value]) => ({ name, value: String(value) }));
      },
      set: (name: string, value: string) => {
        if (!req.cookies) {
          req.cookies = {};
        }
        req.cookies[name] = value;
      },
      has: (name: string) => {
        const cookies = req.cookies || {};
        return name in cookies;
      },
      delete: (name: string) => {
        if (req.cookies) {
          delete req.cookies[name];
        }
      },
    },
    json: async () => {
      // Handle raw body (Buffer) for webhooks
      if (Buffer.isBuffer(req.body)) {
        return JSON.parse(req.body.toString());
      }
      return req.body;
    },
    text: async () => {
      // Handle raw body (Buffer) for webhooks - return as string
      if (Buffer.isBuffer(req.body)) {
        return req.body.toString('utf8');
      }
      return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    },
    formData: async () => {
      // Check if request has multipart/form-data content type
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new Error('Request is not multipart/form-data');
      }

      // Parse multipart/form-data using busboy
      return new Promise<FormData>((resolve, reject) => {
        const formData = new FormData();
        const bb = busboy({ headers: req.headers as any });
        const filePromises: Promise<void>[] = [];
        let hasError = false;

        const checkComplete = () => {
          // Wait for all file promises to complete before resolving
          Promise.all(filePromises)
            .then(() => {
              if (!hasError) {
                resolve(formData);
              }
            })
            .catch((err) => {
              if (!hasError) {
                hasError = true;
                reject(err);
              }
            });
        };

        bb.on('file', (name, file, info) => {
          const { filename, encoding, mimeType } = info;
          const chunks: Buffer[] = [];

          const filePromise = new Promise<void>((fileResolve, fileReject) => {
            file.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });

            file.on('end', () => {
              try {
                const buffer = Buffer.concat(chunks);
                // Create a File object from the buffer
                const blob = new Blob([buffer], { type: mimeType || 'application/octet-stream' });
                const fileObj = new File([blob], filename || 'file', {
                  type: mimeType || 'application/octet-stream',
                });
                formData.append(name, fileObj);
                fileResolve();
              } catch (err) {
                fileReject(err);
              }
            });

            file.on('error', (err) => {
              fileReject(err);
            });
          });

          filePromises.push(filePromise);
        });

        bb.on('field', (name, value) => {
          formData.append(name, value);
        });

        bb.on('finish', () => {
          checkComplete();
        });

        bb.on('error', (err) => {
          if (!hasError) {
            hasError = true;
            reject(err);
          }
        });

        // Try to pipe the request to busboy
        // Note: If Express middleware has already consumed the body, this won't work
        // In that case, we need to ensure multipart requests skip body parsing middleware
        if (req.readable && !req.readableEnded) {
          // Request stream is still available
          req.pipe(bb);
        } else if (Buffer.isBuffer(req.body)) {
          // Body is already a buffer (shouldn't happen for multipart, but handle it)
          bb.end(req.body);
        } else {
          const errorMsg = `Request body already consumed. Stream readable: ${req.readable}, ended: ${req.readableEnded}, body type: ${typeof req.body}. Ensure multipart requests skip body parsing middleware.`;
          console.error('FormData parsing error:', errorMsg);
          reject(new Error(errorMsg));
        }
      });
    },
    nextUrl: new URL(url),
    body: req.body,
    bodyUsed: false,
  } as unknown as NextRequest;

  // Copy headers
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => nextRequest.headers.append(key, v));
      } else {
        nextRequest.headers.set(key, value);
      }
    }
  });

  return nextRequest;
}

/**
 * Convert NextResponse to Express Response
 */
async function sendNextResponse(nextResponse: NextResponse, res: Response): Promise<void> {
  // Set status code
  res.status(nextResponse.status);

  // Copy headers
  nextResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Handle cookies from NextResponse
  const setCookieHeaders = nextResponse.headers.getSetCookie();
  setCookieHeaders.forEach(cookie => {
    res.appendHeader('Set-Cookie', cookie);
  });

  // Get response body
  const body = await nextResponse.json().catch(() => null);
  
  if (body !== null) {
    res.json(body);
  } else {
    // Try text if JSON fails
    const text = await nextResponse.text().catch(() => null);
    if (text !== null) {
      res.send(text);
    } else {
      res.end();
    }
  }
}

/**
 * Create Express context params from Express request params
 */
function createContextParams<T extends Record<string, string>>(req: Request): { params: Promise<T> } {
  return {
    params: Promise.resolve(req.params as T),
  };
}

/**
 * Adapter function to convert Next.js route handler to Express middleware
 */
export function adaptNextRoute(
  handler: (request: NextRequest, context?: { params: Promise<any> }) => Promise<NextResponse> | NextResponse
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nextRequest = createNextRequest(req);
      
      // Create context with params if route has dynamic segments
      const hasParams = Object.keys(req.params).length > 0;
      const context = hasParams ? createContextParams(req) : undefined;
      
      // Call the Next.js handler
      const nextResponse = await handler(nextRequest, context);
      
      // Send the response
      await sendNextResponse(nextResponse, res);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Adapter for handlers that use withAdminAuth or similar wrappers
 * These handlers have signature: (request, context, user) => Promise<NextResponse>
 */
export function adaptWrappedRoute(
  handler: (
    request: NextRequest,
    context: { params: Promise<any> },
    user?: any
  ) => Promise<NextResponse> | NextResponse
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nextRequest = createNextRequest(req);
      const context = createContextParams(req);
      
      // Call the handler (wrappers like withAdminAuth will handle auth internally)
      const nextResponse = await handler(nextRequest, context);
      
      // Send the response
      await sendNextResponse(nextResponse, res);
    } catch (error) {
      next(error);
    }
  };
}

