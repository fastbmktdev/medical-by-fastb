'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Sentry from '@sentry/nextjs';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GymsError({ error, reset }: ErrorProps) {
  const t = useTranslations('error.boundary');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'gyms',
      },
      extra: {
        digest: error.digest,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Gyms Error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
            <div className="relative bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-4">
          {t('title')}
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 text-lg">
          {t('description')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            aria-label="ลองอีกครั้ง"
          >
            <ArrowPathIcon className="w-5 h-5" />
            {t('tryAgain')}
          </button>
          <button
            onClick={() => window.location.href = '/gyms'}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            aria-label="กลับไปหน้าค่ายมวย"
          >
            <HomeIcon className="w-5 h-5" />
            กลับไปหน้าค่ายมวย
          </button>
        </div>

        {/* Error Details Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
          >
            <span className="font-medium">
              {showDetails ? t('hideDetails') : t('showDetails')}
            </span>
            {showDetails ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-2">
                <strong className="text-red-600 dark:text-red-400">{t('details')}:</strong>
              </p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap wrap-break-words">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {process.env.NODE_ENV === 'development' && error.stack && (
                <pre className="text-xs text-gray-500 dark:text-gray-500 mt-2 whitespace-pre-wrap wrap-break-words">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error.digest && `Error ID: ${error.digest}`}
          </p>
        </div>
      </div>
    </div>
  );
}

