/**
 * Custom hook for real-time notifications using Server-Sent Events (SSE)
 * 
 * Usage:
 * const { notifications, unreadCount, isConnected } = useRealtimeNotifications();
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  metadata: any;
  created_at: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Check if browser supports EventSource
      if (typeof EventSource === 'undefined') {
        console.warn('EventSource not supported, falling back to polling');
        // Fall back to polling
        refreshNotifications();
        const pollInterval = setInterval(() => {
          if (isMounted) {
            refreshNotifications();
          } else {
            clearInterval(pollInterval);
          }
        }, 30000);
        return () => clearInterval(pollInterval);
      }

      try {
        const eventSource = new EventSource('/api/notifications/stream');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            setError(null);
            reconnectAttempts.current = 0;
            // Fetch initial notifications
            refreshNotifications();
          }
        };

        eventSource.onmessage = (event) => {
          if (!isMounted) return;

          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'connected':
                console.log('SSE connected:', data.message);
                break;

              case 'ping':
                // Keepalive ping, no action needed
                break;

              case 'notification':
                // New notification received
                if (data.data) {
                  setNotifications((prev) => {
                    // Check if notification already exists
                    const exists = prev.some((n) => n.id === data.data.id);
                    if (exists) return prev;
                    // Add new notification at the beginning
                    return [data.data, ...prev];
                  });
                  setUnreadCount((prev) => prev + 1);
                }
                break;

              case 'notification_update':
                // Notification updated (e.g., marked as read)
                if (data.data) {
                  setNotifications((prev) =>
                    prev.map((notif) =>
                      notif.id === data.data.id ? data.data : notif
                    )
                  );
                  // Update unread count
                  if (data.data.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                  }
                }
                break;

              case 'error':
                console.error('SSE error:', data.message);
                setError(data.message);
                break;

              default:
                console.log('Unknown SSE message type:', data.type);
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        };

        eventSource.onerror = (err) => {
          if (isMounted) {
            setIsConnected(false);
            eventSource.close();

            // Attempt to reconnect
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current += 1;
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                  console.log(`Reconnecting SSE (attempt ${reconnectAttempts.current})...`);
                  connect();
                }
              }, delay);
            } else {
              console.error('Max reconnection attempts reached, falling back to polling');
              setError('Real-time connection lost, using polling');
              // Fall back to polling
              refreshNotifications();
              const pollInterval = setInterval(() => {
                if (isMounted) {
                  refreshNotifications();
                } else {
                  clearInterval(pollInterval);
                }
              }, 30000);
            }
          }
        };
      } catch (err) {
        console.error('Error creating EventSource:', err);
        if (isMounted) {
          setError('Failed to connect to notification stream');
          // Fall back to polling
          refreshNotifications();
        }
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [refreshNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    refreshNotifications,
  };
}

