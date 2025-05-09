'use client';

/**
 * Registers the service worker for caching and offline support
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          document.dispatchEvent(new CustomEvent('serviceWorkerRegistered', { 
            detail: { scope: registration.scope } 
          }));
        })
        .catch((error) => {
          document.dispatchEvent(new CustomEvent('serviceWorkerError', { 
            detail: { error: error instanceof Error ? error.message : 'Unknown error' } 
          }));
        });
    });
  }
}
