/**
 * Email Queue Service
 * 
 * Manages email queue operations: adding emails to queue,
 * processing queue, and handling retries
 */

import { createServerClient } from '@shared/lib/database/supabase/server';

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';
export type EmailType = 
  | 'verification'
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'event_reminder'
  | 'payment_receipt'
  | 'payment_failed'
  | 'partner_approval'
  | 'partner_rejection'
  | 'admin_alert'
  | 'contact_form'
  | 'welcome'
  | 'newsletter'
  | 'promotional'
  | 'other';

export interface EmailQueueItem {
  id: string;
  user_id: string | null;
  to_email: string;
  from_email: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  email_type: EmailType;
  priority: EmailPriority;
  status: EmailStatus;
  retry_count: number;
  max_retries: number;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  provider: string;
  provider_message_id: string | null;
  metadata: Record<string, unknown>;
  related_resource_type: string | null;
  related_resource_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddEmailToQueueParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailType: EmailType;
  priority?: EmailPriority;
  userId?: string;
  fromEmail?: string;
  scheduledAt?: Date;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
  relatedResourceType?: string;
  relatedResourceId?: string;
}

/**
 * Add email to queue
 */
export async function addEmailToQueue(params: AddEmailToQueueParams): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createServerClient();
    
    const {
      to,
      subject,
      htmlContent,
      textContent,
      emailType,
      priority = 'normal',
      userId,
      fromEmail,
      scheduledAt = new Date(),
      maxRetries = 3,
      metadata = {},
      relatedResourceType,
      relatedResourceId,
    } = params;

    // Check user email preferences before adding to queue
    if (userId) {
      const { data: preferences } = await supabase
        .from('user_notification_preferences')
        .select('email_enabled, booking_confirmation, booking_reminder, promotions_news')
        .eq('user_id', userId)
        .single();

      if (preferences) {
        // Check if email notifications are disabled
        if (!preferences.email_enabled) {
          return { success: false, error: 'Email notifications disabled by user' };
        }

        // Check specific email type preferences
        if (emailType === 'booking_confirmation' && !preferences.booking_confirmation) {
          return { success: false, error: 'appointment confirmation emails disabled by user' };
        }

        if (emailType === 'booking_reminder' && !preferences.booking_reminder) {
          return { success: false, error: 'appointment reminder emails disabled by user' };
        }

        if (emailType === 'event_reminder' && !preferences.booking_reminder) {
          // Use booking_reminder preference for event reminders too
          return { success: false, error: 'Event reminder emails disabled by user' };
        }

        if (emailType === 'promotional' && !preferences.promotions_news) {
          return { success: false, error: 'Promotional emails disabled by user' };
        }
      }
    }

    // For newsletter and promotional emails, also check newsletter subscription status
    if (emailType === 'newsletter' || emailType === 'promotional') {
      const { data: subscription } = await supabase
        .from('newsletter_subscriptions')
        .select('is_active, preferences')
        .eq('email', to.toLowerCase())
        .maybeSingle();

      // If subscription doesn't exist or is inactive, skip for newsletter
      if (emailType === 'newsletter' && (!subscription || !subscription.is_active)) {
        return { success: false, error: 'Not subscribed to newsletter' };
      }

      // For promotional emails, check subscription and preferences
      if (emailType === 'promotional' && (!subscription || !subscription.is_active)) {
        // Check if user has promotions_news enabled in notification preferences
        const { data: userPrefs } = userId ? await supabase
          .from('user_notification_preferences')
          .select('promotions_news')
          .eq('user_id', userId)
          .maybeSingle() : { data: null };

        if (!userPrefs?.promotions_news) {
          return { success: false, error: 'Promotional emails not enabled' };
        }
      }
    }

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        user_id: userId || null,
        to_email: to,
        from_email: fromEmail || null,
        subject,
        html_content: htmlContent,
        text_content: textContent || null,
        email_type: emailType,
        priority,
        status: 'pending',
        retry_count: 0,
        max_retries: maxRetries,
        scheduled_at: scheduledAt.toISOString(),
        next_retry_at: scheduledAt.toISOString(),
        provider: 'resend', // Default to Resend
        metadata,
        related_resource_type: relatedResourceType || null,
        related_resource_id: relatedResourceId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding email to queue:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error adding email to queue:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get pending emails from queue (for processing)
 */
export async function getPendingEmails(limit: number = 10): Promise<EmailQueueItem[]> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .or('status.eq.pending,status.eq.failed')
      .lte('scheduled_at', new Date().toISOString())
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending emails:', error);
      return [];
    }

    return (data || []) as EmailQueueItem[];
  } catch (error) {
    console.error('Error fetching pending emails:', error);
    return [];
  }
}

/**
 * Update email queue item status
 */
export async function updateEmailQueueStatus(
  id: string,
  status: EmailStatus,
  options?: {
    providerMessageId?: string;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    retryCount?: number;
    nextRetryAt?: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (status === 'processing') {
      updateData.last_attempt_at = new Date().toISOString();
    }

    if (options?.providerMessageId) {
      updateData.provider_message_id = options.providerMessageId;
    }

    if (options?.errorMessage) {
      updateData.error_message = options.errorMessage;
      updateData.error_details = options.errorDetails || null;
    }

    if (options?.retryCount !== undefined) {
      updateData.retry_count = options.retryCount;
    }

    if (options?.nextRetryAt) {
      updateData.next_retry_at = options.nextRetryAt.toISOString();
    }

    const { error } = await supabase
      .from('email_queue')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating email queue status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating email queue status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Calculate next retry time using exponential backoff
 */
export function calculateNextRetryTime(retryCount: number, baseDelayMinutes: number = 5): Date {
  // Exponential backoff: 5min, 10min, 20min, 40min, etc.
  const delayMinutes = Math.min(baseDelayMinutes * Math.pow(2, retryCount), 1440); // Cap at 24 hours
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
  sent: number;
}> {
  try {
    const supabase = await createServerClient();
    
    const [pendingResult, processingResult, failedResult, sentResult] = await Promise.all([
      supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
      supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    ]);

    return {
      pending: pendingResult.count || 0,
      processing: processingResult.count || 0,
      failed: failedResult.count || 0,
      sent: sentResult.count || 0,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { pending: 0, processing: 0, failed: 0, sent: 0 };
  }
}

