"use client";

import Script from "next/script";

/**
 * Validates Google Analytics Measurement ID format
 * 
 * GA4 Measurement IDs follow patterns like:
 * - G-XXXXXXXXXX (GA4 format)
 * - UA-XXXXXXXXX-X (Universal Analytics format, deprecated but still valid)
 * 
 * @param id - The GA Measurement ID to validate
 * @returns true if the ID matches a valid format, false otherwise
 */
function isValidGAId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmed = id.trim();

  // GA4 format: G- followed by 10 alphanumeric characters
  const ga4Pattern = /^G-[A-Z0-9]{10}$/i;
  
  // Universal Analytics format: UA- followed by digits, dash, and more digits
  const uaPattern = /^UA-\d{4,10}-\d{1,4}$/;

  return ga4Pattern.test(trimmed) || uaPattern.test(trimmed);
}

/**
 * Google Analytics Component
 *
 * Loads Google Analytics only after the page becomes interactive, avoiding a
 * preload hint that could trigger browser warnings when the script isn't
 * requested immediately.
 *
 * Security features:
 * - Validates GA Measurement ID format to prevent injection attacks
 * - Uses URL encoding for the script source URL
 * - Uses JSON.stringify for safe string interpolation in inline scripts
 *
 * Ensure NEXT_PUBLIC_GA_MEASUREMENT_ID is defined in your environment.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    if (process.env.NODE_ENV === 'development') {
    console.warn("Google Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID is not set");
    }
    return null;
  }

  // Validate GA ID format to prevent injection attacks
  if (!isValidGAId(gaId)) {
    console.error(
      "Google Analytics: Invalid GA Measurement ID format. " +
      "Expected format: G-XXXXXXXXXX or UA-XXXXXXXXX-X"
    );
    return null;
  }

  // Use encodeURIComponent to safely encode the ID in the URL
  // This prevents URL injection attacks
  const encodedGaId = encodeURIComponent(gaId.trim());
  const gaSrc = `https://www.googletagmanager.com/gtag/js?id=${encodedGaId}`;

  // Use JSON.stringify to safely escape the ID in the inline script
  // This prevents XSS attacks via script injection
  const safeGaId = JSON.stringify(gaId.trim());

  return (
    <>
      <Script id="ga-script" src={gaSrc} strategy="afterInteractive" />
      <Script id="ga-inline-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${safeGaId});
        `}
      </Script>
    </>
  );
}


