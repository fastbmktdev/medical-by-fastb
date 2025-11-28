"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { NotificationList } from './NotificationList';
import { useRealtimeNotifications } from '@shared/lib/hooks/useRealtimeNotifications';

interface NotificationBellProps {
  className?: string;
}

function NotificationBellComponent({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected, refreshNotifications } = useRealtimeNotifications();

  // Refresh notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const badgeCount = unreadCount > 9 ? '9+' : unreadCount;

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
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 bg-danger text-white text-xs font-semibold  w-5 h-5 flex items-center justify-center"
              aria-label={`${unreadCount} unread notifications`}
            >
              {badgeCount}
            </span>
          )}
          {!isConnected && (
            <span 
              className="absolute -bottom-1 -right-1 bg-warning text-white text-xs  w-2 h-2" 
              title="Using polling mode (real-time connection unavailable)"
              aria-label="Real-time connection unavailable"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-h-[600px] p-0">
        <NotificationList
          onClose={handleClose}
        />
      </PopoverContent>
    </Popover>
  );
}

export const NotificationBell = memo(NotificationBellComponent);

