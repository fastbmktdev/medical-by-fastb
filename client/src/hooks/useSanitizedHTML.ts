/**
 * Custom hook for sanitizing HTML content on the client-side
 * Prevents hydration mismatches by only sanitizing after mount
 */

import { useState, useEffect } from 'react';
import { sanitizeHTML } from '@shared/lib/utils/sanitize';

interface UseSanitizedHTMLOptions {
  /**
   * Whether to replace newlines with <br /> tags before sanitizing
   * @default false
   */
  replaceNewlines?: boolean;
}

/**
 * Hook that sanitizes HTML content on the client-side after mount
 * @param html - The HTML string to sanitize
 * @param options - Configuration options
 * @returns The sanitized HTML string (empty string until after mount)
 */
export function useSanitizedHTML(
  html: string | null | undefined,
  options: UseSanitizedHTMLOptions = {}
): string {
  const { replaceNewlines = false } = options;
  const [sanitized, setSanitized] = useState<string>("");

  useEffect(() => {
    if (html) {
      const processed = replaceNewlines 
        ? html.replace(/\n/g, '<br />')
        : html;
      const sanitizedContent = sanitizeHTML(processed);
      setSanitized(sanitizedContent);
    } else {
      setSanitized("");
    }
  }, [html, replaceNewlines]);

  return sanitized;
}

