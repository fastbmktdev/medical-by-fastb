import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales: Thai, English, Japanese
export const locales = ['th', 'en', 'jp'] as const;
export type Locale = typeof locales[number];

// Locale display names
export const localeNames: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English',
  jp: '日本語',
};

// Locale flags/emojis
export const localeFlags: Record<Locale, string> = {
  th: '🇹🇭',
  en: '🇬🇧',
  jp: '🇯🇵',
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  // If locale is not provided or invalid, use default locale instead of calling notFound()
  // This allows the middleware to handle redirects properly
  const validLocale = locale && locales.includes(locale as Locale) 
    ? (locale as Locale) 
    : 'th'; // Default to 'th' if invalid

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
