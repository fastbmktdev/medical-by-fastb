"use client";

import Script from "next/script";

/**
 * Google Analytics Component
 *
 * Loads Google Analytics only after the page becomes interactive, avoiding a
 * preload hint that could trigger browser warnings when the script isn't
 * requested immediately.
 *
 * Ensure NEXT_PUBLIC_GA_MEASUREMENT_ID is defined in your environment.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    console.warn("Google Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID is not set");
    return null;
  }

  const gaSrc = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;

  return (
    <>
      <Script id="ga-script" src={gaSrc} strategy="afterInteractive" />
      <Script id="ga-inline-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}


