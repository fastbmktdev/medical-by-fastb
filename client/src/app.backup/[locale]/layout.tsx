import type { Metadata } from "next";
import { LayoutWrapper, ErrorBoundary } from "@/components/shared";
import { GoogleAnalytics } from "@/components/shared/analytics/GoogleAnalytics";
import { LocaleSetter } from "@/components/shared/LocaleSetter";
import { FixedBackground } from "@/components/shared/ui";
import AssetLoader from "@/components/shared/ui/AssetLoader";
import GamificationNotification from "@/components/features/gamification/GamificationNotification";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

export const metadata: Metadata = {
  title: "Medical Platform",
  description:
    "แพลตฟอร์มสำหรับค้นหาและจองโรงพยาบาลชั้นนำ และซื้อตั๋วห้องตรวจทั่วประเทศไทย",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  // getMessages() automatically gets the locale from the route context in [locale] routes
  const messages = await getMessages();

  return (
    <>
      <LocaleSetter locale={locale} />
      <AssetLoader>
        <FixedBackground />
        <NextIntlClientProvider messages={messages}>
          <LayoutWrapper>
            <ErrorBoundary>{children}</ErrorBoundary>
            <GamificationNotification />
          </LayoutWrapper>
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </AssetLoader>
    </>
  );
}
