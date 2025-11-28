'use client';

import { Container } from '@/components/design-system/primitives/Container';
import { AuthPageProps } from './types';

export function AuthPage({
  title,
  subtitle,
  children,
  showLogo = true,
  backgroundImage,
  className = '',
  testId = 'auth-page',
  ...props
}: AuthPageProps) {
  return (
    <div
      className={`
        min-h-screen flex items-center justify-center
        bg-white
        ${className}
      `}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-testid={testId}
      {...props}
    >
      {/* Background Overlay */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
      )}

      <Container maxWidth="sm" className="relative z-10">
        <div className="bg-white backdrop-blur-xl border border-gray-300  p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            {showLogo && (
              <div className="mb-6">
                {/* Logo placeholder - replace with actual logo */}
                <div className="w-16 h-16 bg-brand-primary  mx-auto flex items-center justify-center">
                  <span className=" font-semibold text-xl">MT</span>
                </div>
              </div>
            )}
            
            <h1 className="text-2xl font-semibold mb-2 text-zinc-950">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            {children}
          </div>
        </div>
      </Container>
    </div>
  );
}