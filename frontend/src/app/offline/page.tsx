'use client';

import React from 'react';
import Link from 'next/link';

export default function OfflinePage(): React.ReactElement {
  return (
    <div className="max-w-md mx-auto mt-16 p-8 border border-gray-200 rounded-lg shadow-sm text-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-gray-500 text-4xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 010-7.072m-3.536 3.536a1 1 0 10-1.414 1.414" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M12 13.5V12m0 0V10.5m0 1.5h1.5m-1.5 0h-1.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">You're Offline</h1>
        <p className="text-gray-600">
          It looks like you've lost your internet connection. Some features may be limited until you're back online.
        </p>
        <p className="text-sm text-gray-500">
          You can still access previously viewed content in offline mode.
        </p>
        <Link 
          href="/" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
