'use client';

import { Container } from '@/components/design-system/primitives/Container';
import { HeroSectionProps } from './types';

export function HeroSection({
  title,
  subtitle,
  description,
  actions,
  backgroundImage,
  overlay = true,
  centered = true,
  className = '',
  testId = 'hero-section',
  ...props
}: HeroSectionProps) {
  return (
    <section
      className={`
        relative py-20 lg:py-32 overflow-hidden
        ${backgroundImage ? 'bg-cover bg-center' : 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black'}
        ${className}
      `}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
      }}
      data-testid={testId}
      {...props}
    >
      {/* Background Overlay */}
      {backgroundImage && overlay && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />

      <Container className="relative z-10">
        <div className={`max-w-4xl ${centered ? 'mx-auto text-center' : ''}`}>
          {/* Subtitle */}
          {subtitle && (
            <p className="text-red-400 font-semibold text-lg mb-4 tracking-wide uppercase">
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          )}

          {/* Actions */}
          {actions && (
            <div className={`flex flex-col sm:flex-row gap-4 ${centered ? 'justify-center' : ''}`}>
              {actions}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}