"use client";

import { useCallback, memo } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n';
import { useParams } from 'next/navigation';

function LanguageSwitcherComponent() {
  const params = useParams();
  const localeFromHook = useLocale() as Locale;
  // Get locale from params (more reliable than useLocale hook)
  const currentLocale = (params?.locale as Locale) || localeFromHook;
  const pathname = usePathname();

  const switchLanguage = useCallback((newLocale: Locale) => {
    // pathname from next-intl already excludes locale prefix
    // Remove any existing locale prefix just to be safe
    let pathWithoutLocale = pathname || '/';
    
    // Remove any locale prefix that might be present
    pathWithoutLocale = pathWithoutLocale.replace(/^\/(th|en|jp)(\/|$)/, '/');
    if (pathWithoutLocale === '') {
      pathWithoutLocale = '/';
    }
    
    // Build new path with new locale
    const newPath = pathWithoutLocale === '/' 
      ? `/${newLocale}` 
      : `/${newLocale}${pathWithoutLocale}`;
    
    // Use window.location for full page reload to ensure locale updates correctly
    // This prevents locale prefix stacking issues
    window.location.href = newPath;
  }, [pathname]);

  return (
    <>
      {/* Desktop Language Switcher */}
      <div className="relative group">
        <div className="hidden md:inline-flex justify-center items-center hover:bg-gray-100 border border-gray-300  w-12 h-10 font-semibold text-sm cursor-pointer transition-colors text-zinc-950">
          {currentLocale.toUpperCase()}
        </div>
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 right-0 absolute bg-white backdrop-blur-md shadow-xl border border-gray-200  w-40 z-50 overflow-hidden">
          <div className="py-1">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLanguage(loc)}
                className={`
                  flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors
                  ${currentLocale === loc
                    ? 'bg-purple-100 text-purple-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-zinc-950'
                  }
                `}
              >
                <span className="text-lg">{localeFlags[loc]}</span>
                <span>{localeNames[loc]} ({loc.toUpperCase()})</span>
                {currentLocale === loc && (
                  <span className="ml-auto text-purple-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Language Switcher */}
      <div className="md:hidden pt-4 border-gray-200 border-t">
        <h3 className="px-4 font-semibold text-gray-600 text-sm mb-2">
          Language
        </h3>
        <div className="grid gap-1">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLanguage(loc)}
              className={`
                flex items-center gap-2 px-4 py-2.5  text-sm transition-colors
                ${currentLocale === loc
                  ? 'bg-red-100 text-red-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-zinc-950'
                }
              `}
            >
              <span className="text-lg">{localeFlags[loc]}</span>
              <span>{localeNames[loc]} ({loc.toUpperCase()})</span>
              {currentLocale === loc && (
                <span className="ml-auto text-red-600">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export const LanguageSwitcher = memo(LanguageSwitcherComponent);
