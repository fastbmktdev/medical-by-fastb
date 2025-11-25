/**
 * MSW Initializer Component
 * Initializes MSW in development mode when NEXT_PUBLIC_USE_MOCK_DATA is enabled
 */

'use client';

import { useEffect, useState } from 'react';

export function MSWInitializer() {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    // Only initialize MSW in development and when mock data is enabled
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
    ) {
      async function initMSW() {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
        });
        setMswReady(true);
        console.log('✅ MSW initialized with mock data');
      }

      initMSW().catch((error) => {
        console.error('Failed to initialize MSW:', error);
      });
    } else {
      setMswReady(true);
    }
  }, []);

  // Don't render anything
  return null;
}

