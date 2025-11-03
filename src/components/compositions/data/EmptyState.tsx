'use client';

import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  DocumentIcon 
} from '@heroicons/react/24/outline';
import { EmptyStateProps } from './types';

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
  testId = 'empty-state',
  ...props
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return <MagnifyingGlassIcon className="w-16 h-16 text-zinc-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />;
      default:
        return <DocumentIcon className="w-16 h-16 text-zinc-500" />;
    }
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center py-12 px-6
        ${className}
      `}
      data-testid={testId}
      {...props}
    >
      {/* Icon */}
      <div className="mb-4">
        {icon || getDefaultIcon()}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-zinc-400 mb-6 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div data-testid={`${testId}-action`}>
          {action}
        </div>
      )}
    </div>
  );
}