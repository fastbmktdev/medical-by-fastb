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
        bg-gradient-to-br from-zinc-950 via-zinc-900 to-black
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}

      <Container maxWidth="sm" className="relative z-10">
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            {showLogo && (
              <div className="mb-6">
                {/* Logo placeholder - replace with actual logo */}
                <div className="w-16 h-16 bg-brand-primary rounded-xl mx-auto flex items-center justify-center">
                  <span className=" font-bold text-xl">MT</span>
                </div>
              </div>
            )}
            
            <h1 className="text-2xl font-bold mb-2">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-zinc-400">
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