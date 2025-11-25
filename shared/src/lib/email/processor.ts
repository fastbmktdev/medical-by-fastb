/**
 * Email Queue Processor Helper
 * 
 * Provides functions to trigger email processing without cron
 * Use this for event-driven email processing
 */

/**
 * Trigger email queue processing (non-blocking)
 * This is called automatically when emails are added to queue
 * 
 * @param immediate - If true, process immediately in background. If false, just queue for later processing
 */
export async function triggerEmailProcessing(immediate: boolean = true): Promise<void> {
  if (!immediate) {
    // Just queue it, don't process now
    return;
  }

  // In server-side context, we can trigger processing directly
  // In edge runtime or client-side, we'll use fetch
  if (typeof window === 'undefined') {
    // Server-side: Trigger processing via API endpoint (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    'http://localhost:3000';

    // Fire and forget - don't wait for response
    // Use setTimeout to make it truly non-blocking
    setTimeout(() => {
      fetch(`${baseUrl}/api/queue/process-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((error) => {
        // Silently fail - email will be processed later
        console.warn('Failed to trigger email processing:', error);
      });
    }, 0);
  } else {
    // Client-side: Use fetch directly
    const baseUrl = window.location.origin;
    fetch(`${baseUrl}/api/queue/process-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      console.warn('Failed to trigger email processing:', error);
    });
  }
}

/**
 * Check if email should be processed immediately
 * High priority emails are processed immediately, others are queued
 */
export function shouldProcessImmediately(priority: 'low' | 'normal' | 'high' | 'urgent'): boolean {
  return priority === 'high' || priority === 'urgent';
}

