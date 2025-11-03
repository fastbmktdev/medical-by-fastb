"use client";

import { useState, useEffect } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { NotificationList } from './NotificationList';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unread count
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const response = await fetch('/api/notifications?unread=true&limit=1');
        const result = await response.json();

        if (result.success) {
          setUnreadCount(result.unread_count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh count when popover opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/notifications?unread=true&limit=1')
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setUnreadCount(result.unread_count || 0);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      showArrow
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          className={`relative ${className}`}
          aria-label="Notifications"
        >
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-h-[600px] p-0">
        <NotificationList
          onClose={() => setIsOpen(false)}
          onMarkAsRead={() => setUnreadCount(prev => Math.max(0, prev - 1))}
          onMarkAllRead={() => setUnreadCount(0)}
        />
      </PopoverContent>
    </Popover>
  );
}

