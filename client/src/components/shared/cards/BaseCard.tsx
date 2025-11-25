import React, { memo } from 'react';
import { Card, type CardProps } from '@/components/design-system/primitives/Card';

interface BaseCardProps extends Omit<CardProps, 'interactive'> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Base Card Component (Legacy)
 * 
 * Backward-compatible wrapper around the new unified Card component.
 * Maintains existing API while providing enhanced functionality.
 * 
 * @deprecated Use the new Card component directly for better features and consistency.
 */
const BaseCardComponent = ({ children, className = '', onClick, ...props }: BaseCardProps) => {
  return (
    <Card
      className={`group ${className}`}
      interactive={Boolean(onClick)}
      onClick={onClick}
      padding="none"
      {...props}
    >
      {children}
    </Card>
  );
};

export const BaseCard = memo(BaseCardComponent);
