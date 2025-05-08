'use client';

import React from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export default function OfflineIndicator(): React.ReactElement | null {
  const isOffline = useOfflineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-orange-500 text-white py-2 px-4 rounded-md shadow-md z-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 010-7.072m-3.536 3.536a1 1 0 10-1.414 1.414" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.172 16.172a4 4 0 015.656 0M12 13.5V12m0 0V10.5m0 1.5h1.5m-1.5 0h-1.5" 
          />
        </svg>
        <span className="font-medium">Offline Mode</span>
      </div>
    </div>
  );
}
