/**
 * Enhanced Click Tracking Utilities
 * 
 * Provides comprehensive click tracking beyond GA Enhanced Measurement.
 * Tracks custom click events with detailed context for better analytics.
 */

import { trackEvent } from './analytics';

/**
 * Track button click
 */
export function trackButtonClick(
  buttonText: string,
  buttonId?: string,
  location?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('button_click', {
    button_text: buttonText,
    button_id: buttonId,
    location: location || (typeof window !== 'undefined' ? window.location.pathname : undefined),
    ...additionalData,
  });
}

/**
 * Track link click
 */
export function trackLinkClick(
  linkText: string,
  linkUrl: string,
  linkId?: string,
  isExternal?: boolean,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('link_click', {
    link_text: linkText,
    link_url: linkUrl,
    link_id: linkId,
    is_external: isExternal || false,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track CTA (Call-to-Action) click
 */
export function trackCTAClick(
  ctaText: string,
  ctaType: 'primary' | 'secondary' | 'tertiary',
  ctaId?: string,
  section?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('cta_click', {
    cta_text: ctaText,
    cta_type: ctaType,
    cta_id: ctaId,
    section: section,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track form field interaction
 */
export function trackFormFieldInteraction(
  fieldName: string,
  fieldType: string,
  action: 'focus' | 'blur' | 'change' | 'submit',
  formId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('form_field_interaction', {
    field_name: fieldName,
    field_type: fieldType,
    action: action,
    form_id: formId,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track navigation click
 */
export function trackNavigationClick(
  navItem: string,
  navType: 'menu' | 'breadcrumb' | 'pagination' | 'tab',
  destination?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('navigation_click', {
    nav_item: navItem,
    nav_type: navType,
    destination: destination,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track card/item click
 */
export function trackCardClick(
  cardTitle: string,
  cardType: string,
  cardId?: string,
  position?: number,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('card_click', {
    card_title: cardTitle,
    card_type: cardType,
    card_id: cardId,
    position: position,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track image click
 */
export function trackImageClick(
  imageAlt: string,
  imageSrc: string,
  imageId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('image_click', {
    image_alt: imageAlt,
    image_src: imageSrc,
    image_id: imageId,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track video interaction
 */
export function trackVideoInteraction(
  videoTitle: string,
  action: 'play' | 'pause' | 'seek' | 'complete',
  videoId?: string,
  currentTime?: number,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('video_interaction', {
    video_title: videoTitle,
    action: action,
    video_id: videoId,
    current_time: currentTime,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track dropdown/select interaction
 */
export function trackDropdownInteraction(
  dropdownName: string,
  selectedValue: string,
  dropdownId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('dropdown_interaction', {
    dropdown_name: dropdownName,
    selected_value: selectedValue,
    dropdown_id: dropdownId,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track modal interaction
 */
export function trackModalInteraction(
  modalName: string,
  action: 'open' | 'close' | 'confirm' | 'cancel',
  modalId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('modal_interaction', {
    modal_name: modalName,
    action: action,
    modal_id: modalId,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track search interaction
 */
export function trackSearchInteraction(
  searchTerm: string,
  action: 'search' | 'clear' | 'suggestion_click',
  resultCount?: number,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('search_interaction', {
    search_term: searchTerm,
    action: action,
    result_count: resultCount,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(
  depth: number,
  pagePath?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('scroll_depth', {
    depth: depth,
    page_path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : undefined),
    ...additionalData,
  });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(
  timeInSeconds: number,
  pagePath?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('time_on_page', {
    time_seconds: timeInSeconds,
    page_path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : undefined),
    ...additionalData,
  });
}

