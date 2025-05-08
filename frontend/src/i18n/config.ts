import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

const isServer = typeof window === 'undefined';

const i18n = i18next.createInstance();

if (!isServer) {
  void i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      defaultNS: 'common',
      ns: ['common', 'auth', 'navigation', 'content'],
      interpolation: {
        escapeValue: false,
      },
      supportedLngs: ['en', 'es', 'fr', 'de', 'ar'],
    });
}

export default i18n;
