'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FormFieldProps } from './types';

export function FormField({
  label,
  description,
  error,
  required = false,
  children,
  layout = 'vertical',
  className = '',
  testId = 'form-field',
  ...props
}: FormFieldProps) {
  const fieldId = `${testId}-input`;

  if (layout === 'horizontal') {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-start ${className}`}
        data-testid={testId}
        {...props}
      >
        {/* Label Column */}
        <div className="md:pt-2">
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-white"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
          {description && (
            <p className="text-xs text-zinc-400 mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Input Column */}
        <div className="md:col-span-2">
          <div data-testid={`${testId}-input-wrapper`}>
            {children}
          </div>
          {error && (
            <div
              className="flex items-center gap-1 mt-2 text-sm text-red-400"
              data-testid={`${testId}-error`}
            >
              <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-2 ${className}`}
      data-testid={testId}
      {...props}
    >
      {/* Label */}
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-white"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Description */}
      {description && (
        <p className="text-xs text-zinc-400">
          {description}
        </p>
      )}

      {/* Input */}
      <div data-testid={`${testId}-input-wrapper`}>
        {children}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-1 text-sm text-red-400"
          data-testid={`${testId}-error`}
        >
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}