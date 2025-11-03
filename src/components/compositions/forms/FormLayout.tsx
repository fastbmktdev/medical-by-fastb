'use client';

import { Container } from '@/components/design-system/primitives/Container';
import { FormLayoutProps } from './types';

export function FormLayout({
  title,
  description,
  children,
  maxWidth = 'md',
  spacing = 'md',
  className = '',
  testId = 'form-layout',
  ...props
}: FormLayoutProps) {
  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
  };

  return (
    <Container
      maxWidth={maxWidth}
      className={`${spacingClasses[spacing]} ${className}`}
      data-testid={testId}
      {...props}
    >
      {/* Form Header */}
      {(title || description) && (
        <div className="text-center mb-8">
          {title && (
            <h1 className="text-2xl font-bold mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-zinc-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-6">
        {children}
      </div>
    </Container>
  );
}