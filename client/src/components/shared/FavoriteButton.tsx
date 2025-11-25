"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@heroui/react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface FavoriteButtonProps {
  itemType: 'hospital' | 'product' | 'event';
  itemId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'bordered' | 'light' | 'flat';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
  showLabel?: boolean;
}

function FavoriteButtonComponent({
  itemType,
  itemId,
  size = 'md',
  variant = 'solid',
  color = 'danger',
  className = '',
  showLabel = false,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if item is already favorited
  useEffect(() => {
    let isMounted = true;

    async function checkFavorite() {
      try {
        const response = await fetch(
          `/api/favorites/check?item_type=${itemType}&item_id=${itemId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted && result.success) {
          setIsFavorite(result.isFavorite || false);
        }
      } catch (error) {
        if (isMounted) {
          // Silently fail - don't show error for check operation
          console.warn('Error checking favorite:', error);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    checkFavorite();

    return () => {
      isMounted = false;
    };
  }, [itemType, itemId]);

  const handleToggle = useCallback(async () => {
    if (isLoading || isChecking) return;

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/favorites?item_type=${itemType}&item_id=${itemId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setIsFavorite(false);
          toast.success('ลบออกจากรายการโปรดแล้ว');
        } else {
          throw new Error(result.error || 'Failed to remove favorite');
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: itemType, item_id: itemId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setIsFavorite(true);
          toast.success('เพิ่มในรายการโปรดแล้ว');
        } else {
          throw new Error(result.error || 'Failed to add favorite');
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isChecking, isFavorite, itemType, itemId]);

  const ariaLabel = isFavorite ? 'Remove from favorites' : 'Add to favorites';
  const buttonText = showLabel ? (isFavorite ? 'ลบออกจากโปรด' : 'เพิ่มเป็นโปรด') : undefined;
  const IconComponent = isFavorite ? HeartSolidIcon : HeartIcon;

  if (isChecking) {
    return (
      <Button
        isIconOnly={!showLabel}
        size={size}
        variant={variant}
        color={color}
        isLoading={true}
        className={className}
        aria-label={ariaLabel}
        disabled
      />
    );
  }

  return (
    <Button
      isIconOnly={!showLabel}
      size={size}
      variant={variant}
      color={color}
      onPress={handleToggle}
      isLoading={isLoading}
      className={className}
      aria-label={ariaLabel}
      disabled={isLoading}
      startContent={
        showLabel ? <IconComponent className="w-5 h-5" /> : undefined
      }
    >
      {showLabel ? (
        buttonText
      ) : (
        <IconComponent className="w-5 h-5" />
      )}
    </Button>
  );
}

export const FavoriteButton = memo(FavoriteButtonComponent);

