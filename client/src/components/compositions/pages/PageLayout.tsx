'use client';

import { Container } from '@/components/design-system/primitives/Container';
import { PageLayoutProps } from './types';

export function PageLayout({
  title,
  description,
  children,
  maxWidth = 'full',
  padding = true,
  background = 'default',
  className = '',
  testId = 'page-layout',
  ...props
}: PageLayoutProps) {
  const backgroundClasses = {
    default: 'bg-zinc-100',
    gradient: 'bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950',
    pattern: 'bg-zinc-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black',
  };

  // Map boolean padding to Container's padding type
  const containerPadding = padding ? 'md' : 'none';

  return (
    <div
      className={`min-h-screen ${backgroundClasses[background]} ${className}`}
      data-testid={testId}
      {...props}
    >
      <Container maxWidth={maxWidth} padding={containerPadding}>
        {/* Page Header */}
        {(title || description) && (
          <div className="py-8 border-b border-zinc-700 mb-8">
            {title && (
              <h1 className="text-3xl font-semibold mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-zinc-400 text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="pb-8">
          {children}
        </div>
      </Container>
    </div>
  );
}