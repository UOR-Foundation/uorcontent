'use client';

import React, { useRef } from 'react';

interface ScreenReaderHook {
  announce: (message: string, politeness?: 'assertive' | 'polite') => void;
  ScreenReaderAnnouncer: React.FC;
}

/**
 * Hook for announcing messages to screen readers
 * @returns Object with announce function and ScreenReaderAnnouncer component
 */
export function useScreenReader(): ScreenReaderHook {
  const assertiveRef = useRef<HTMLDivElement | null>(null);
  const politeRef = useRef<HTMLDivElement | null>(null);

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param politeness - The politeness level of the announcement
   */
  const announce = (message: string, politeness: 'assertive' | 'polite' = 'polite') => {
    if (!message) return;

    const element = politeness === 'assertive' ? assertiveRef.current : politeRef.current;
    
    if (!element) return;

    element.textContent = '';
    
    void element.offsetHeight;
    
    element.textContent = message;
  };

  const ScreenReaderAnnouncer: React.FC = () => (
    <>
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-assertive"
      />
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-polite"
      />
    </>
  );

  return {
    announce,
    ScreenReaderAnnouncer,
  };
}
