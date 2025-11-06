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
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
