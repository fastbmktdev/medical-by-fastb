'use client';

import { Container } from '@/components/design-system/primitives/Container';
import { CTASectionProps } from './types';

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  backgroundVariant = 'gradient',
  className = '',
  testId = 'cta-section',
  ...props
}: CTASectionProps) {
  const backgroundClasses = {
    default: 'bg-zinc-900',
    gradient: 'bg-linear-to-r from-red-900 to-red-700',
    pattern: 'bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-zinc-900 to-zinc-950',
  };

  return (
    <section
      className={`py-16 ${backgroundClasses[backgroundVariant]} ${className}`}
      data-testid={testId}
      {...props}
    >
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p className="text-xl text-zinc-200 mb-8 leading-relaxed">
              {description}
            </p>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}