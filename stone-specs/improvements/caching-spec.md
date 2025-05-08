# Caching Strategy Implementation Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: Client-Side Caching Strategy  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the implementation of a comprehensive client-side caching strategy for the UOR Content Management Client. The caching system will improve performance, reduce network requests, and provide a better user experience, especially for frequently accessed data and during network interruptions.

## Requirements

1. **Core Functionality**
   - Implement client-side caching for API responses
   - Support configurable cache invalidation strategies
   - Provide offline data access for critical content
   - Implement background data synchronization

2. **Performance Requirements**
   - Reduce API request frequency for frequently accessed data
   - Minimize loading times for cached content
   - Implement efficient cache storage mechanisms
   - Optimize memory usage with selective caching

3. **User Experience Requirements**
   - Provide seamless offline experience for critical features
   - Display appropriate indicators for cached vs. live data
   - Support manual refresh for cached content
   - Maintain data consistency across the application

4. **Integration Requirements**
   - Seamless integration with React Query's caching
   - Support for service worker caching
   - Compatibility with authentication system
   - Integration with error handling system

## User Stories

### As a developer, I want to:

1. Configure caching strategies for different data types.
   ```typescript
   const { data } = useQuery(['concepts'], fetchConcepts, {
     staleTime: 5 * 60 * 1000, // 5 minutes
     cacheTime: 30 * 60 * 1000, // 30 minutes
   });
   ```

2. Implement offline support for critical features.
   ```typescript
   const { data, isOffline } = useOfflineQuery(['concepts'], fetchConcepts);
   ```

3. Manually invalidate cache when needed.
   ```typescript
   queryClient.invalidateQueries(['concepts']);
   ```

4. Prefetch data for improved user experience.
   ```typescript
   queryClient.prefetchQuery(['concept', id], () => fetchConceptById(id));
   ```

### As a user, I want to:

1. Access previously viewed content when offline.
2. Experience faster loading times for frequently accessed data.
3. See indicators when viewing cached content.
4. Manually refresh data when needed.

## Technical Specifications

### React Query Caching Configuration

1. **QueryClient Configuration**
   ```typescript
   // lib/queryClient.ts
   import { QueryClient } from '@tanstack/react-query';

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 30 * 60 * 1000, // 30 minutes
         refetchOnWindowFocus: true,
         refetchOnMount: true,
         refetchOnReconnect: true,
         retry: 3,
         retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
       },
     },
   });
   ```

2. **Content Type Specific Caching**
   ```typescript
   // hooks/useConcepts.ts
   import { useQuery } from '@tanstack/react-query';
   import { fetchConcepts } from '../api/services';

   export function useConcepts(options?: any) {
     return useQuery({
       queryKey: ['concepts', options],
       queryFn: () => fetchConcepts(options),
       staleTime: 10 * 60 * 1000, // 10 minutes for concepts
       cacheTime: 60 * 60 * 1000, // 1 hour
     });
   }

   // hooks/usePredicates.ts
   import { useQuery } from '@tanstack/react-query';
   import { fetchPredicates } from '../api/services';

   export function usePredicates(options?: any) {
     return useQuery({
       queryKey: ['predicates', options],
       queryFn: () => fetchPredicates(options),
       staleTime: 30 * 60 * 1000, // 30 minutes for predicates (less frequently updated)
       cacheTime: 2 * 60 * 60 * 1000, // 2 hours
     });
   }
   ```

### Offline Support

1. **Offline Detection Hook**
   ```typescript
   // hooks/useOfflineStatus.ts
   import { useState, useEffect } from 'react';

   export function useOfflineStatus() {
     const [isOffline, setIsOffline] = useState(!navigator.onLine);

     useEffect(() => {
       const handleOnline = () => setIsOffline(false);
       const handleOffline = () => setIsOffline(true);

       window.addEventListener('online', handleOnline);
       window.addEventListener('offline', handleOffline);

       return () => {
         window.removeEventListener('online', handleOnline);
         window.removeEventListener('offline', handleOffline);
       };
     }, []);

     return isOffline;
   }
   ```

2. **Offline Query Hook**
   ```typescript
   // hooks/useOfflineQuery.ts
   import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
   import { useOfflineStatus } from './useOfflineStatus';
   import { useToast } from '../components/ToastProvider';

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
         // Don't refetch when offline
         refetchOnWindowFocus: !isOffline && (options?.refetchOnWindowFocus ?? true),
         refetchOnMount: !isOffline && (options?.refetchOnMount ?? true),
         refetchOnReconnect: !isOffline && (options?.refetchOnReconnect ?? true),
         // Always use cache when offline
         staleTime: isOffline ? Infinity : options?.staleTime,
       }),
       isOffline,
     };
   }
   ```

### Service Worker Caching

1. **Service Worker Registration**
   ```typescript
   // lib/serviceWorker.ts
   export function registerServiceWorker() {
     if ('serviceWorker' in navigator) {
       window.addEventListener('load', () => {
         navigator.serviceWorker
           .register('/service-worker.js')
           .then((registration) => {
             console.log('ServiceWorker registration successful with scope: ', registration.scope);
           })
           .catch((error) => {
             console.error('ServiceWorker registration failed: ', error);
           });
       });
     }
   }
   ```

2. **Service Worker Implementation**
   ```javascript
   // public/service-worker.js
   const CACHE_NAME = 'uor-content-cache-v1';
   const RUNTIME_CACHE = 'uor-content-runtime';

   // Resources to cache on install
   const PRECACHE_URLS = [
     '/',
     '/offline',
     '/styles.css',
     '/main.js',
     '/favicon.ico',
   ];

   // Cache static resources during installation
   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then((cache) => {
         return cache.addAll(PRECACHE_URLS);
       })
     );
   });

   // Clean up old caches during activation
   self.addEventListener('activate', (event) => {
     const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
     event.waitUntil(
       caches.keys().then((cacheNames) => {
         return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
       }).then((cachesToDelete) => {
         return Promise.all(cachesToDelete.map((cacheToDelete) => {
           return caches.delete(cacheToDelete);
         }));
       }).then(() => self.clients.claim())
     );
   });

   // Cache API responses
   self.addEventListener('fetch', (event) => {
     // Skip cross-origin requests
     if (event.request.url.startsWith(self.location.origin)) {
       // For API requests, use network first, then cache
       if (event.request.url.includes('/api/')) {
         event.respondWith(
           fetch(event.request)
             .then((response) => {
               // Cache successful responses
               if (response.status === 200) {
                 const responseToCache = response.clone();
                 caches.open(RUNTIME_CACHE).then((cache) => {
                   cache.put(event.request, responseToCache);
                 });
               }
               return response;
             })
             .catch(() => {
               // If network fails, try cache
               return caches.match(event.request).then((cachedResponse) => {
                 if (cachedResponse) {
                   return cachedResponse;
                 }
                 // If not in cache, return offline page for navigation requests
                 if (event.request.mode === 'navigate') {
                   return caches.match('/offline');
                 }
                 // Otherwise return a 404 response
                 return new Response(JSON.stringify({ error: 'Network error' }), {
                   status: 404,
                   headers: { 'Content-Type': 'application/json' },
                 });
               });
             })
         );
       } else {
         // For non-API requests, use cache first, then network
         event.respondWith(
           caches.match(event.request).then((cachedResponse) => {
             if (cachedResponse) {
               return cachedResponse;
             }
             return fetch(event.request).then((response) => {
               // Cache successful responses
               if (response.status === 200) {
                 const responseToCache = response.clone();
                 caches.open(RUNTIME_CACHE).then((cache) => {
                   cache.put(event.request, responseToCache);
                 });
               }
               return response;
             }).catch(() => {
               // If network fails and it's a navigation request, return offline page
               if (event.request.mode === 'navigate') {
                 return caches.match('/offline');
               }
               // Otherwise return a 404 response
               return new Response(JSON.stringify({ error: 'Network error' }), {
                 status: 404,
                 headers: { 'Content-Type': 'application/json' },
               });
             });
           })
         );
       }
     }
   });
   ```

### Offline Page

1. **Offline Page Implementation**
   ```tsx
   // app/offline/page.tsx
   import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
   import { MdWifiOff } from 'react-icons/md';
   import Link from 'next/link';

   export default function OfflinePage() {
     return (
       <Box maxW="md" mx="auto" mt={16} p={8} borderWidth="1px" borderRadius="lg" textAlign="center">
         <VStack spacing={6}>
           <Icon as={MdWifiOff} boxSize={16} color="gray.500" />
           <Heading size="lg">You're Offline</Heading>
           <Text>
             It looks like you've lost your internet connection. Some features may be limited until you're back online.
           </Text>
           <Text fontSize="sm" color="gray.500">
             You can still access previously viewed content in offline mode.
           </Text>
           <Button as={Link} href="/" colorScheme="blue">
             Go to Home
           </Button>
         </VStack>
       </Box>
     );
   }
   ```

### Offline Indicator

1. **Offline Indicator Component**
   ```tsx
   // components/OfflineIndicator.tsx
   import { useOfflineStatus } from '../hooks/useOfflineStatus';
   import { Box, Text, Icon, HStack } from '@chakra-ui/react';
   import { MdWifiOff } from 'react-icons/md';

   export default function OfflineIndicator() {
     const isOffline = useOfflineStatus();

     if (!isOffline) {
       return null;
     }

     return (
       <Box
         position="fixed"
         bottom={4}
         right={4}
         bg="orange.500"
         color="white"
         py={2}
         px={4}
         borderRadius="md"
         boxShadow="md"
         zIndex={1000}
       >
         <HStack spacing={2}>
           <Icon as={MdWifiOff} />
           <Text fontWeight="medium">Offline Mode</Text>
         </HStack>
       </Box>
     );
   }
   ```

2. **Offline Indicator Usage**
   ```tsx
   // app/layout.tsx
   import OfflineIndicator from '../components/OfflineIndicator';

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <body>
           <ChakraProvider>
             <QueryClientProvider client={queryClient}>
               {children}
               <OfflineIndicator />
             </QueryClientProvider>
           </ChakraProvider>
         </body>
       </html>
     );
   }
   ```

## Implementation Plan

1. **Phase 1: React Query Caching**
   - Configure QueryClient with optimal caching settings
   - Implement content type specific caching strategies
   - Add cache invalidation logic
   - Set up prefetching for critical data

2. **Phase 2: Offline Support**
   - Implement offline detection
   - Create offline query hooks
   - Add offline indicators
   - Implement offline page

3. **Phase 3: Service Worker**
   - Create service worker for caching
   - Implement cache strategies for different request types
   - Add background sync for offline mutations
   - Set up service worker registration

4. **Phase 4: Persistence Layer**
   - Implement IndexedDB for larger datasets
   - Create persistence utilities
   - Add data synchronization logic
   - Implement data versioning

5. **Phase 5: Testing and Validation**
   - Test caching strategies
   - Validate offline functionality
   - Test service worker caching
   - Ensure proper data synchronization

## Success Criteria

1. Reduced API requests for frequently accessed data
2. Faster loading times for cached content
3. Seamless offline experience for critical features
4. Proper cache invalidation when data changes
5. Clear indicators for offline mode
6. Successful background synchronization when coming online
7. Comprehensive test coverage for caching functionality
8. Zero linting warnings or errors
9. Successful integration with React Query and service worker

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Stale data | Implement proper cache invalidation strategies |
| Excessive memory usage | Use selective caching and cache expiration |
| Service worker conflicts | Implement versioning and proper activation |
| Data synchronization issues | Use optimistic updates with proper error handling |

## Dependencies

- @tanstack/react-query: ^5.0.0
- @chakra-ui/react: ^2.8.0
- Next.js: ^15.0.0
- TypeScript: ^5.0.0
- idb: ^7.0.0 (for IndexedDB)

## References

- [React Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
