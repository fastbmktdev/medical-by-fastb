/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for server-side error tracking and performance monitoring.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set sample rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
  
  // Integrations
  integrations: [
    Sentry.httpIntegration(),
  ],
  
  // Before sending event to Sentry
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      
      // Remove sensitive query parameters
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        params.delete('token');
        params.delete('api_key');
        params.delete('password');
        event.request.query_string = params.toString();
      }
    }
    
    // Filter out development errors if needed
    if (process.env.NODE_ENV === 'development' && process.env.SENTRY_IGNORE_DEV === 'true') {
      return null;
    }
    
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    // Database connection errors (handled separately)
    'ECONNREFUSED',
    'ETIMEDOUT',
    // Validation errors (expected)
    'ValidationError',
    'UnauthorizedError',
  ],
});

