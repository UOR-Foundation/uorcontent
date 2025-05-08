'use client';

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * Custom hook for translations with additional functionality
 * @param namespace - Translation namespace
 * @returns Translation utilities
 */
export function useTranslation(namespace = 'common') {
  const { t, i18n } = useI18nTranslation(namespace);

  /**
   * Change the current language
   * @param language - Language code to switch to
   */
  const changeLanguage = useCallback(
    (language: string) => {
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
        if (typeof window !== 'undefined') {
          localStorage.setItem('i18nextLng', language);
          document.documentElement.lang = language;
          document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
        }
      }
    },
    [i18n]
  );

  /**
   * Get the current language
   * @returns Current language code
   */
  const getCurrentLanguage = useCallback(() => i18n.language || 'en', [i18n]);

  /**
   * Check if the current language is RTL
   * @returns Whether the current language is RTL
   */
  const isCurrentLanguageRTL = useCallback(
    () => isRTL(getCurrentLanguage()),
    [getCurrentLanguage]
  );

  /**
   * Get all available languages
   * @returns Array of available language codes
   */
  const getAvailableLanguages = useCallback(
    () => i18n.options.supportedLngs || ['en'],
    [i18n]
  );

  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isCurrentLanguageRTL,
    getAvailableLanguages,
  };
}

/**
 * Check if a language is RTL
 * @param language - Language code to check
 * @returns Whether the language is RTL
 */
function isRTL(language: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
}
