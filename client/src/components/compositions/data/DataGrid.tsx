'use client';

import { Loading } from '@/components/design-system/primitives/Loading';
import { EmptyState } from './EmptyState';
import { DataGridProps } from './types';

export function DataGrid({
  items,
  loading = false,
  emptyText = 'No items available',
  columns = 3,
  gap = 'md',
  onItemClick,
  className = '',
  testId = 'data-grid',
  ...props
}: DataGridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const getGridColumns = () => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    };
    return colsMap[Math.min(columns, 6) as keyof typeof colsMap] || colsMap[3];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No Items"
        description={emptyText}
        variant="default"
      />
    );
  }

  return (
    <div
      className={`grid ${getGridColumns()} ${gapClasses[gap]} ${className}`}
      data-testid={testId}
      {...props}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`
            transition-transform duration-200
            ${onItemClick ? 'cursor-pointer hover:scale-105' : ''}
          `}
          onClick={onItemClick ? () => onItemClick(item, index) : undefined}
          data-testid={`${testId}-item-${item.id}`}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}