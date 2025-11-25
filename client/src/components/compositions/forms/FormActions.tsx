'use client';

import { FormActionsProps } from './types';

export function FormActions({
  children,
  align = 'right',
  sticky = false,
  spacing = 'md',
  className = '',
  testId = 'form-actions',
  ...props
}: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const baseClasses = `
    flex flex-col sm:flex-row items-center
    ${alignClasses[align]} ${spacingClasses[spacing]}
    pt-6 mt-6 border-t border-zinc-700
  `;

  const stickyClasses = sticky
    ? 'sticky bottom-0 bg-zinc-100 text-zinc-950 border-t border-zinc-700 p-4 -mx-6 -mb-6'
    : '';

  return (
    <div
      className={`${baseClasses} ${stickyClasses} ${className}`}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
}