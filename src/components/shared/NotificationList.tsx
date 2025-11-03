"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, ScrollShadow, Divider } from '@heroui/react';
import {
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

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

interface NotificationListProps {
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationList({
  onClose,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      const result = await response.json();

      if (result.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        onMarkAsRead?.(id);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        onMarkAllRead?.();
        toast.success('ทำเครื่องหมายอ่านทั้งหมดแล้ว');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        toast.success('ลบการแจ้งเตือนแล้ว');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
      case 'booking_reminder':
        return '📅';
      case 'payment_received':
      case 'payment_failed':
        return '💳';
      case 'badge_earned':
      case 'level_up':
      case 'points_awarded':
        return '🏆';
      case 'promotion':
        return '🎉';
      case 'partner_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString: string) => {
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
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="border-4 border-primary border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
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
            <span className="bg-danger text-white text-xs font-bold rounded-full px-2 py-1">
              {unreadCount}
            </span>
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
                    <div className="text-2xl flex-shrink-0">
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
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-default-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-default-400 mt-2">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
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

