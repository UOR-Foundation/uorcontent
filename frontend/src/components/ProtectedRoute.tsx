'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): React.ReactElement {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthenticated, router, pathname, requiredRole, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="hidden"></div>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <div className="hidden"></div>;
  }

  return <>{children}</>;
}
