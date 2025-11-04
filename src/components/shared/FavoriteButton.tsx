"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface FavoriteButtonProps {
  itemType: 'gym' | 'product' | 'event';
  itemId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'bordered' | 'light' | 'flat';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
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
    async function checkFavorite() {
      try {
        const response = await fetch(
          `/api/favorites/check?item_type=${itemType}&item_id=${itemId}`
        );
        const result = await response.json();

        if (result.success) {
          setIsFavorite(result.isFavorite || false);
        }
      } catch (error) {
        console.error('Error checking favorite:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkFavorite();
  }, [itemType, itemId]);

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/favorites?item_type=${itemType}&item_id=${itemId}`,
          { method: 'DELETE' }
        );
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
        const result = await response.json();

        if (result.success) {
          setIsFavorite(true);
          toast.success('เพิ่มในรายการโปรดแล้ว');
        } else {
          throw new Error(result.error || 'Failed to add favorite');
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button
        isIconOnly={!showLabel}
        size={size}
        variant={variant}
        color={color}
        isLoading={true}
        className={className}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      startContent={
        showLabel ? (
          isFavorite ? (
            <HeartSolidIcon className="w-5 h-5" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )
        ) : undefined
      }
    >
      {showLabel ? (
        isFavorite ? 'ลบออกจากโปรด' : 'เพิ่มเป็นโปรด'
      ) : (
        isFavorite ? (
          <HeartSolidIcon className="w-5 h-5" />
        ) : (
          <HeartIcon className="w-5 h-5" />
        )
      )}
    </Button>
  );
}

