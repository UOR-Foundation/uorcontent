'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for i18n functionality
 * Handles initialization of i18next and provides translation context
 */
export function I18nProvider({ children }: I18nProviderProps): React.ReactElement {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on('initialized', () => {
        setIsI18nInitialized(true);
      });
    } else {
      setIsI18nInitialized(true);
    }
  }, []);

  if (!isI18nInitialized && typeof window !== 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
