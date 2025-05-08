'use client';

import { useEffect } from 'react';
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useOfflineStatus } from './useOfflineStatus';
import { useToast } from '../components/ToastProvider';

/**
 * Hook for querying data with offline support
 * @param queryKey - The query key for React Query
 * @param queryFn - The query function that fetches data
 * @param options - Additional React Query options
 * @returns Query result with additional offline status
 */
export function useOfflineQuery<TData, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  const isOffline = useOfflineStatus();
  const { showInfoToast } = useToast();

  useEffect(() => {
    if (isOffline) {
      showInfoToast(
        'Offline Mode',
        'You are currently offline. Some data may not be up to date.'
      );
    }
  }, [isOffline, showInfoToast]);

  return {
    ...useQuery<TData, TError>({
      queryKey,
      queryFn,
      ...options,
      refetchOnWindowFocus: !isOffline && (options?.refetchOnWindowFocus ?? true),
      refetchOnMount: !isOffline && (options?.refetchOnMount ?? true),
      refetchOnReconnect: !isOffline && (options?.refetchOnReconnect ?? true),
      staleTime: isOffline ? Infinity : options?.staleTime,
    }),
    isOffline,
  };
}
