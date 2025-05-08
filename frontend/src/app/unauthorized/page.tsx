'use client';

import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage(): React.ReactElement {
  return (
    <div className="max-w-md mx-auto mt-16 p-6 border border-gray-200 rounded-lg shadow-sm text-center">
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6 text-gray-600">
        You do not have permission to access this page. Please contact an administrator if you believe this is an error.
      </p>
      <Link
        href="/"
        className="inline-block py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Return to Home
      </Link>
    </div>
  );
}
