/**
 * XSS Sanitization Utility
 * Uses DOMPurify (and isomorphic-dompurify for SSR) to prevent XSS attacks.
 * Compatible with both client-side and Next.js server-side environments.
 */

type DOMPurifyLike = { sanitize: (dirty: string, config?: unknown) => string };

// Singleton holders for DOMPurify instances
let domPurifyClient: DOMPurifyLike | null = null;
let domPurifyServer: DOMPurifyLike | null = null;

/**
 * Gets the correct DOMPurify instance for the environment.
 */
function getDOMPurify(): DOMPurifyLike {
  if (typeof window !== 'undefined') {
    // Browser: use dompurify
    if (!domPurifyClient) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      domPurifyClient = require('dompurify');
    }
    return domPurifyClient!;
  } else {
    // Server: isomorphic-dompurify + jsdom
    if (!domPurifyServer) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const createDOMPurify = require('isomorphic-dompurify').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window as unknown as Window & typeof globalThis;
      domPurifyServer = createDOMPurify(window);
    }
    return domPurifyServer!;
  }
}

/**
 * Strict DOMPurify configuration for HTML sanitization.
 */
const PURIFY_CONFIG: import('dompurify').Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div',
    'b', 'i', 'sub', 'sup', 'small', 'mark', 'del', 'ins'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'class', 'id', 'data-*'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_ATTR: [
    'style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'
  ],
  FORBID_TAGS: [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'select', 'textarea', 'meta', 'link', 'style', 'base'
  ],
  USE_PROFILES: { html: true, svg: false, svgFilters: false },
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitizes an HTML string, allowing only safe HTML tags and attributes.
 */
export function sanitizeHTML(
  dirty: string | null | undefined,
  config?: Partial<typeof PURIFY_CONFIG>
): string {
  if (typeof dirty !== 'string' || !dirty) return '';
  try {
    const purify = getDOMPurify();
    const mergedConfig = { ...PURIFY_CONFIG, ...config };
    return purify.sanitize(dirty, mergedConfig);
  } catch (err) {
    console.error('Error sanitizing HTML:', err);
    return '';
  }
}

/**
 * Strips all HTML tags, outputting safe text only.
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (typeof dirty !== 'string' || !dirty) return '';
  try {
    return getDOMPurify().sanitize(dirty, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    });
  } catch (err) {
    console.error('Error sanitizing text:', err);
    return '';
  }
}

/**
 * Sanitizes a value for safe use in HTML attributes (e.g. href, title, alt).
 */
export function sanitizeAttribute(dirty: string | null | undefined): string {
  if (typeof dirty !== 'string' || !dirty) return '';
  try {
    return getDOMPurify()
      .sanitize(dirty, {
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true,
      })
      .trim();
  } catch (err) {
    console.error('Error sanitizing attribute:', err);
    return '';
  }
}

/**
 * Sanitizes a URL, blocking javascript:, data:, vbscript:, and file: protocols, etc.
 * Allows http, https, mailto, tel, and optionally relative URLs.
 */
export function sanitizeURL(
  url: string | null | undefined,
  allowRelative: boolean = true
): string {
  if (typeof url !== 'string' || !url) return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(proto => lower.startsWith(proto))) return '';

  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  const hasAllowedProtocol = allowedProtocols.some(proto => lower.startsWith(proto));

  if (allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('./'))) {
    return trimmed;
  }
  if (!hasAllowedProtocol) return '';

  try {
    return getDOMPurify().sanitize(trimmed, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      ALLOWED_URI_REGEXP: PURIFY_CONFIG.ALLOWED_URI_REGEXP,
    });
  } catch (err) {
    console.error('Error sanitizing URL:', err);
    return '';
  }
}

/**
 * Helper for React dangerouslySetInnerHTML with proper sanitization.
 */
export function getSanitizedHTMLProps(
  content: string | null | undefined
): { dangerouslySetInnerHTML: { __html: string } } {
  return { dangerouslySetInnerHTML: { __html: sanitizeHTML(content) } };
}

/**
 * Quickly check if input contains potentially dangerous HTML code before sanitizing.
 */
export function containsDangerousHTML(content: string | null | undefined): boolean {
  if (typeof content !== 'string' || !content) return false;

  const dangerPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<form[^>]*>/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return dangerPatterns.some(pattern => pattern.test(content));
}
