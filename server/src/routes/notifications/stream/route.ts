/**
 * Server-Sent Events (SSE) Stream for Real-time Notifications
 * GET /api/notifications/stream
 * 
 * Streams real-time notifications to authenticated users
 * Uses Server-Sent Events for one-way communication from server to client
 */

import { NextRequest } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const sendMessage = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Send keepalive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          sendMessage(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('Error sending keepalive:', error);
          clearInterval(keepAliveInterval);
          controller.close();
        }
      }, 30000);

      // Set up database subscription using Supabase Realtime (if available)
      // Note: Supabase Realtime requires proper configuration in Supabase dashboard
      let channel: RealtimeChannel | null = null;
      
      try {
        // Try to create a channel for real-time notifications
        // This will work if Supabase Realtime is enabled for the notifications table
        channel = supabase
          .channel(`notifications:${user.id}`, {
            config: {
              broadcast: { self: true },
              presence: { key: user.id },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              try {
                sendMessage(JSON.stringify({
                  type: 'notification',
                  data: payload.new,
                }));
              } catch (error) {
                console.error('Error sending notification:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              try {
                sendMessage(JSON.stringify({
                  type: 'notification_update',
                  data: payload.new,
                }));
              } catch (error) {
                console.error('Error sending notification update:', error);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              sendMessage(JSON.stringify({
                type: 'connected',
                message: 'Real-time notifications enabled',
              }));
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('Supabase Realtime not available, using polling fallback');
              sendMessage(JSON.stringify({
                type: 'fallback',
                message: 'Using polling mode',
              }));
            }
          });

      } catch (error) {
        console.warn('Error setting up Supabase Realtime, using polling fallback:', error);
        sendMessage(JSON.stringify({
          type: 'fallback',
          message: 'Using polling mode',
        }));
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
        clearInterval(keepAliveInterval);
        controller.close();
      });

      // Fallback: Poll for new notifications if Realtime is not available
      // This ensures notifications still work even if Realtime subscription fails
      let lastCheckedAt = new Date();
      const pollInterval = setInterval(async () => {
        try {
          const { data: newNotifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .gt('created_at', lastCheckedAt.toISOString())
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && newNotifications && newNotifications.length > 0) {
            for (const notification of newNotifications) {
              sendMessage(JSON.stringify({
                type: 'notification',
                data: notification,
              }));
            }
            lastCheckedAt = new Date(newNotifications[0].created_at);
          }
        } catch (error) {
          console.error('Error polling notifications:', error);
        }
      }, 5000); // Poll every 5 seconds as fallback

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

