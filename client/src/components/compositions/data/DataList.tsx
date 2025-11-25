'use client';

import { Loading } from '@/components/design-system/primitives/Loading';
import { EmptyState } from './EmptyState';
import { DataListProps } from './types';

export function DataList({
  items,
  loading = false,
  emptyText = 'No items available',
  onItemClick,
  showDividers = true,
  className = '',
  testId = 'data-list',
  ...props
}: DataListProps) {
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
      className={`bg-zinc-100 border border-zinc-700  overflow-hidden ${className}`}
      data-testid={testId}
      {...props}
    >
      <div className={showDividers ? 'divide-y divide-zinc-700' : 'space-y-1'}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`
              p-4 transition-colors
              ${onItemClick ? 'cursor-pointer hover:bg-zinc-900' : ''}
            `}
            onClick={onItemClick ? () => onItemClick(item, index) : undefined}
            data-testid={`${testId}-item-${item.id}`}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {item.avatar && (
                <div className="shrink-0">
                  {item.avatar}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className=" font-medium truncate">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              {item.actions && (
                <div className="shrink-0">
                  {item.actions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}