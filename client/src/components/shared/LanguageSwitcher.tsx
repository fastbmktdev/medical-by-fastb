"use client";

import { useCallback, memo, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n';
import { useParams } from 'next/navigation';
import { Modal } from '@/components/compositions/modals/Modal';
import { CheckIcon } from '@heroicons/react/24/solid';

function LanguageSwitcherComponent() {
  const params = useParams();
  const localeFromHook = useLocale() as Locale;
  // Get locale from params (more reliable than useLocale hook)
  const currentLocale = (params?.locale as Locale) || localeFromHook;
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const switchLanguage = useCallback((newLocale: Locale) => {
    if (newLocale === currentLocale || isSwitching) return;
    
    setIsSwitching(true);
    
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
    
    // Close modal if open
    setIsModalOpen(false);
    
    // Use window.location for full page reload to ensure locale updates correctly
    // This prevents locale prefix stacking issues
    window.location.href = newPath;
  }, [pathname, currentLocale, isSwitching]);

  return (
    <>
      {/* Language Switcher Button - All Screen Sizes */}
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isSwitching}
          className="inline-flex justify-center items-center hover:bg-brand-light active:bg-gray-100 border border-gray-300 hover:border-brand-primary w-12 h-10 font-semibold text-sm cursor-pointer transition-all duration-200 text-zinc-950 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
          aria-label="เปลี่ยนภาษา"
          aria-haspopup="dialog"
        >
          {isSwitching ? (
            <svg className="animate-spin h-4 w-4 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span className="flex items-center gap-1">
              <span className="text-base">{localeFlags[currentLocale]}</span>
              <span>{currentLocale.toUpperCase()}</span>
            </span>
          )}
        </button>
      </div>

      {/* Language Selection Modal - All Screen Sizes */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="เลือกภาษา / Select Language / 言語を選択"
        size="sm"
        showCloseButton={true}
        testId="language-modal"
      >
        <div className="p-6">
          <div className="space-y-3">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLanguage(loc)}
                disabled={isSwitching || loc === currentLocale}
                className={`
                  flex items-center gap-4 w-full px-5 py-4 text-sm text-left transition-all duration-200
                  ${currentLocale === loc
                    ? 'bg-brand-light text-brand-primary font-semibold border-2 border-brand-primary shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-zinc-950 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                  ${isSwitching || loc === currentLocale ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}
                  ${isSwitching ? 'opacity-50' : ''}
                `}
                aria-label={`เปลี่ยนเป็น ${localeNames[loc]}`}
                aria-pressed={currentLocale === loc}
              >
                <span className="text-3xl shrink-0">{localeFlags[loc]}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{localeNames[loc]}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{loc.toUpperCase()}</div>
                </div>
                {currentLocale === loc && (
                  <CheckIcon className="w-6 h-6 text-brand-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

export const LanguageSwitcher = memo(LanguageSwitcherComponent);
