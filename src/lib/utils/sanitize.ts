/**
 * XSS Sanitization Utility
 * 
 * Provides HTML sanitization using DOMPurify to prevent XSS attacks
 * Supports both client-side and server-side rendering (Next.js)
 */

// For client-side
let DOMPurify: ReturnType<typeof import('dompurify').default> | null = null;

// For server-side (Next.js)
let serverDOMPurify: ReturnType<typeof import('isomorphic-dompurify').default> | null = null;

/**
 * Initialize DOMPurify based on environment
 */
function getDOMPurify(): ReturnType<typeof import('dompurify').default> {
  if (typeof window !== 'undefined') {
    // Client-side: use dompurify directly
    if (!DOMPurify) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      DOMPurify = require('dompurify');
    }
    // Non-null assertion: DOMPurify is guaranteed to be initialized after the check above
    return DOMPurify!;
  } else {
    // Server-side: use isomorphic-dompurify with dynamic import to avoid bundling jsdom
    if (!serverDOMPurify) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const createDOMPurify = require('isomorphic-dompurify').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window as unknown as Window & typeof globalThis;
      serverDOMPurify = createDOMPurify(window);
    }
    // Non-null assertion: serverDOMPurify is guaranteed to be initialized after the check above
    return serverDOMPurify! as ReturnType<typeof import('dompurify').default>;
  }
}

/**
 * DOMPurify configuration with strict security settings
 */
const PURIFY_CONFIG: import('dompurify').Config = {
  // Only allow safe HTML tags
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div',
    'b', 'i', 'sub', 'sup', 'small', 'mark', 'del', 'ins'
  ],
  // Only allow safe attributes
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'class', 'id', 'data-*'
  ],
  // Allowed URI schemes for links
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Remove dangerous attributes
  FORBID_ATTR: [
    'style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'
  ],
  // Remove dangerous tags completely
  FORBID_TAGS: [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'select', 'textarea', 'meta', 'link', 'style', 'base'
  ],
  // Sanitize SVG
  USE_PROFILES: { html: true, svg: false, svgFilters: false },
  // Keep relative URLs
  KEEP_CONTENT: true,
  // Return DOM instead of string (for better performance in some cases)
  RETURN_DOM: false,
  // Return DOM Fragment (can be useful)
  RETURN_DOM_FRAGMENT: false,
  // Return trusted types (if browser supports it)
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitize HTML string to prevent XSS attacks
 * 
 * @param dirty - Unsanitized HTML string
 * @param config - Optional DOMPurify configuration (merges with default)
 * @returns Sanitized HTML string safe to use with dangerouslySetInnerHTML
 * 
 * @example
 * ```tsx
 * const userContent = "<script>alert('XSS')</script><p>Safe content</p>";
 * const safe = sanitizeHTML(userContent);
 * <div dangerouslySetInnerHTML={{ __html: safe }} />
 * ```
 */
export function sanitizeHTML(
  dirty: string | null | undefined,
  config?: Partial<typeof PURIFY_CONFIG>
): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  try {
    const purify = getDOMPurify();
    const finalConfig = { ...PURIFY_CONFIG, ...config };
    return purify.sanitize(dirty, finalConfig);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Return empty string on error to be safe
    return '';
  }
}

/**
 * Sanitize plain text (removes all HTML tags)
 * Use this when you want to display user input as plain text only
 * 
 * @param dirty - Text that may contain HTML
 * @returns Plain text with all HTML tags removed
 * 
 * @example
 * ```tsx
 * const userInput = "<script>alert('XSS')</script>Hello World";
 * const safe = sanitizeText(userInput); // "Hello World"
 * ```
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  try {
    const purify = getDOMPurify();
    // Sanitize with no allowed tags (effectively removes all HTML)
    return purify.sanitize(dirty, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    });
  } catch (error) {
    console.error('Error sanitizing text:', error);
    return '';
  }
}

/**
 * Sanitize HTML attribute value
 * Use this for sanitizing attribute values (e.g., href, title, alt)
 * 
 * @param dirty - Unsanitized attribute value
 * @returns Sanitized attribute value safe to use in HTML attributes
 * 
 * @example
 * ```tsx
 * const userUrl = "javascript:alert('XSS')";
 * const safe = sanitizeAttribute(userUrl); // ""
 * ```
 */
export function sanitizeAttribute(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  try {
    const purify = getDOMPurify();
    // Sanitize and strip HTML tags (attributes shouldn't contain HTML)
    return purify.sanitize(dirty, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    }).trim();
  } catch (error) {
    console.error('Error sanitizing attribute:', error);
    return '';
  }
}

/**
 * Sanitize URL (for href attributes)
 * Validates and sanitizes URLs to prevent javascript: protocol and other dangerous schemes
 * 
 * @param url - URL to sanitize
 * @param allowRelative - Whether to allow relative URLs (default: true)
 * @returns Sanitized URL or empty string if invalid
 * 
 * @example
 * ```tsx
 * const userLink = "javascript:alert('XSS')";
 * const safe = sanitizeURL(userLink); // ""
 * 
 * const validLink = "https://example.com";
 * const safe2 = sanitizeURL(validLink); // "https://example.com"
 * ```
 */
export function sanitizeURL(
  url: string | null | undefined,
  allowRelative: boolean = true
): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove whitespace
  const trimmed = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Allow http, https, mailto, tel
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  const hasProtocol = allowedProtocols.some(p => lowerUrl.startsWith(p));
  
  // Allow relative URLs if specified
  if (allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('./'))) {
    return trimmed;
  }

  // Must have allowed protocol
  if (!hasProtocol) {
    return '';
  }

  // Additional sanitization
  try {
    const purify = getDOMPurify();
    // Use DOMPurify to sanitize the URL
    return purify.sanitize(trimmed, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  } catch (error) {
    console.error('Error sanitizing URL:', error);
    return '';
  }
}

/**
 * React component props helper for sanitized HTML content
 * 
 * @param content - HTML content to sanitize
 * @returns Props object safe for dangerouslySetInnerHTML
 * 
 * @example
 * ```tsx
 * const userContent = "<p>User generated content</p>";
 * <div {...getSanitizedHTMLProps(userContent)} />
 * ```
 */
export function getSanitizedHTMLProps(
  content: string | null | undefined
): { dangerouslySetInnerHTML: { __html: string } } {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHTML(content),
    },
  };
}

/**
 * Check if a string contains potentially dangerous HTML
 * Useful for logging or alerting before sanitization
 * 
 * @param content - Content to check
 * @returns true if content contains potentially dangerous patterns
 */
export function containsDangerousHTML(content: string | null | undefined): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<form[^>]*>/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(content));
}
