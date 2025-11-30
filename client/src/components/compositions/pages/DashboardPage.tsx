'use client';

import { Loading } from '@/components/design-system/primitives/Loading';
import { ErrorDisplay } from '@/components/shared/feedback/ErrorDisplay';
import { DashboardPageProps } from './types';

export function DashboardPage({
  title,
  description,
  actions,
  children,
  loading = false,
  error,
  className = '',
  testId = 'dashboard-page',
  ...props
}: DashboardPageProps) {
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <ErrorDisplay error={error} variant="card" />
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className}`}
      data-testid={testId}
      {...props}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            {title}
          </h1>
          {description && (
            <p className="text-zinc-400 mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loading size="lg" />
        </div>
      ) : (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}