"use client";

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, ScrollShadow, Chip } from '@heroui/react';
import {
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@/navigation';
import { toast } from 'react-hot-toast';
import { useRealtimeNotifications } from '@shared/lib/hooks/useRealtimeNotifications';
import { Loading } from '@/components/design-system/primitives/Loading';

interface NotificationListProps {
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

// Notification icon mapping - moved outside component for better performance
const NOTIFICATION_ICONS: Record<string, string> = {
  booking_confirmation: '📅',
  booking_reminder: '📅',
  event_reminder: '🎫',
  payment_received: '💳',
  payment_failed: '💳',
  badge_earned: '🏆',
  level_up: '🏆',
  points_awarded: '🏆',
  promotion: '🎉',
  partner_message: '💬',
};

const DEFAULT_ICON = '🔔';

function NotificationListComponent({
  onClose,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationListProps) {
  const { notifications, unreadCount, isConnected, refreshNotifications } = useRealtimeNotifications();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    refreshNotifications().finally(() => setIsLoading(false));
  }, [refreshNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        onMarkAsRead?.(id);
        refreshNotifications();
      } else {
        throw new Error(result.error || 'Failed to mark as read');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      toast.error(message);
    }
  }, [onMarkAsRead, refreshNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        onMarkAllRead?.();
        toast.success('ทำเครื่องหมายอ่านทั้งหมดแล้ว');
        refreshNotifications();
      } else {
        throw new Error(result.error || 'Failed to mark all as read');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      toast.error(message);
    }
  }, [onMarkAllRead, refreshNotifications]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        await refreshNotifications();
        toast.success('ลบการแจ้งเตือนแล้ว');
      } else {
        throw new Error(result.error || 'Failed to delete notification');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      toast.error(message);
    }
  }, [refreshNotifications]);

  const getNotificationIcon = useCallback((type: string) => {
    return NOTIFICATION_ICONS[type] || DEFAULT_ICON;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-default-200">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">การแจ้งเตือน</h3>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-xs font-bold  px-2 py-1">
              {unreadCount}
            </span>
          )}
          {isConnected && (
            <Chip size="sm" color="success" variant="flat">
              Real-time
            </Chip>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="light"
              onPress={handleMarkAllRead}
              startContent={<CheckCircleIcon className="w-4 h-4" />}
            >
              อ่านทั้งหมด
            </Button>
          )}
          {onClose && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollShadow className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-default-400">ไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {notifications.map((notification) => {
              const NotificationContent = (
                <div
                  className={`p-4 hover:bg-default-100 transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`font-semibold ${
                            !notification.is_read
                              ? 'text-foreground'
                              : 'text-default-600'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary  shrink-0 mt-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-default-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.metadata &&
                        Object.keys(notification.metadata).length > 0 && (
                          <div className="mt-2 space-y-1 text-xs text-default-500">
                            {Object.entries(notification.metadata).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className="font-medium capitalize">{key}:</span>
                                <span className="truncate">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      <p className="text-xs text-default-400 mt-2">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!notification.is_read && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleMarkAsRead(notification.id)}
                          aria-label="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(notification.id)}
                        aria-label="Delete"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );

              if (notification.link_url) {
                return (
                  <Link
                    key={notification.id}
                    href={notification.link_url}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="block"
                  >
                    {NotificationContent}
                  </Link>
                );
              }

              return (
                <div key={notification.id}>{NotificationContent}</div>
              );
            })}
          </div>
        )}
      </ScrollShadow>
    </div>
  );
}

export const NotificationList = memo(NotificationListComponent);

