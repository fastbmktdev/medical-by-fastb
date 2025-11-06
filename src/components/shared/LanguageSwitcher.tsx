"use client";

import { useLocale } from 'next-intl';
import { usePathname } from '@/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n';
import { useParams } from 'next/navigation';

export function LanguageSwitcher() {
  const params = useParams();
  const localeFromHook = useLocale() as Locale;
  // Get locale from params (more reliable than useLocale hook)
  const currentLocale = (params?.locale as Locale) || localeFromHook;
  const pathname = usePathname();

  const switchLanguage = (newLocale: Locale) => {
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
  };

  return (
    <>
      {/* Desktop Language Switcher */}
      <div className="relative group">
        <div className="hidden md:inline-flex justify-center items-center hover:bg-white/5 border border-white/20 rounded w-12 h-10 font-semibold text-sm cursor-pointer transition-colors">
          {currentLocale.toUpperCase()}
        </div>
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 right-0 absolute bg-zinc-950/95 backdrop-blur-md shadow-xl border border-white/10 rounded-md w-40 z-50 overflow-hidden">
          <div className="py-1">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLanguage(loc)}
                className={`
                  flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors
                  ${currentLocale === loc
                    ? 'bg-red-500/20 text-red-400 font-semibold'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span className="text-lg">{localeFlags[loc]}</span>
                <span>{localeNames[loc]} ({loc.toUpperCase()})</span>
                {currentLocale === loc && (
                  <span className="ml-auto text-red-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Language Switcher */}
      <div className="md:hidden pt-4 border-white/10 border-t">
        <h3 className="px-4 font-semibold text-white/60 text-sm mb-2">
          Language
        </h3>
        <div className="grid gap-1">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLanguage(loc)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-md text-sm transition-colors
                ${currentLocale === loc
                  ? 'bg-red-500/20 text-red-400 font-semibold'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <span className="text-lg">{localeFlags[loc]}</span>
              <span>{localeNames[loc]} ({loc.toUpperCase()})</span>
              {currentLocale === loc && (
                <span className="ml-auto text-red-400">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
