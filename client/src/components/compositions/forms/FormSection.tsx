'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/design-system/primitives/Button';
import { FormSectionProps } from './types';

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = '',
  testId = 'form-section',
  ...props
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`border-b border-zinc-700 last:border-b-0 pb-6 last:pb-0 ${className}`}
      data-testid={testId}
      {...props}
    >
      {/* Section Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {title}
              </h3>
              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpanded}
                  className="ml-2"
                  aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                  data-testid={`${testId}-toggle`}
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-zinc-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Section Content */}
      {(!collapsible || isExpanded) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}