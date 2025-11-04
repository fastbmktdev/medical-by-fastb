"use client";

import { useState, useEffect } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { NotificationList } from './NotificationList';
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected, refreshNotifications } = useRealtimeNotifications();

  // Refresh notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

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
          {!isConnected && (
            <span className="absolute -bottom-1 -right-1 bg-warning text-white text-xs rounded-full w-2 h-2" 
                  title="Using polling mode (real-time connection unavailable)" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-h-[600px] p-0">
        <NotificationList
          onClose={() => setIsOpen(false)}
          onMarkAsRead={() => {}}
          onMarkAllRead={() => {}}
        />
      </PopoverContent>
    </Popover>
  );
}

