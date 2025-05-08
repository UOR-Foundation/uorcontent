# State Management Implementation Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: State Management with React Query  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the implementation of React Query for state management in the UOR Content Management Client. React Query will provide a robust solution for managing server state, caching, and data fetching, replacing the current custom implementation in the MCPClientProvider.

## Requirements

1. **Core Functionality**
   - Implement React Query for server state management
   - Replace the current custom implementation in MCPClientProvider
   - Provide hooks for different content types (concepts, predicates, resources, topics)
   - Implement caching with configurable stale time and cache invalidation

2. **Performance Requirements**
   - Reduce unnecessary re-fetching of data
   - Implement background refetching for stale data
   - Support pagination and infinite scrolling for large datasets
   - Optimize memory usage with selective query invalidation

3. **Developer Experience**
   - Create custom hooks for each content type
   - Provide consistent error handling across all queries
   - Implement loading states and error states
   - Support TypeScript with full type safety

4. **Integration Requirements**
   - Maintain compatibility with existing components
   - Ensure proper integration with MCP server
   - Support existing API endpoints and data formats
   - Provide migration path for existing components

## User Stories

### As a developer, I want to:

1. Fetch data from the MCP server using React Query hooks to simplify data fetching and state management.
   ```typescript
   const { data, isLoading, error } = useQuery('concepts', fetchConcepts);
   ```

2. Create, update, and delete content using mutation hooks to ensure proper cache invalidation.
   ```typescript
   const { mutate, isLoading } = useMutation(createConcept, {
     onSuccess: () => {
       queryClient.invalidateQueries('concepts');
     }
   });
   ```

3. Access cached data without refetching to improve performance and user experience.
   ```typescript
   const cachedData = queryClient.getQueryData('concepts');
   ```

4. Implement optimistic updates to provide immediate feedback to users.
   ```typescript
   const { mutate } = useMutation(updateConcept, {
     onMutate: async (newConcept) => {
       await queryClient.cancelQueries('concepts');
       const previousConcepts = queryClient.getQueryData('concepts');
       queryClient.setQueryData('concepts', old => [...old, newConcept]);
       return { previousConcepts };
     },
     onError: (err, newConcept, context) => {
       queryClient.setQueryData('concepts', context.previousConcepts);
     },
     onSettled: () => {
       queryClient.invalidateQueries('concepts');
     }
   });
   ```

### As a user, I want to:

1. See immediate feedback when creating, updating, or deleting content.
2. Experience faster page loads due to cached data.
3. Continue using the application during network interruptions with cached data.
4. See real-time updates when data changes on the server.

## Technical Specifications

### React Query Implementation

1. **QueryClient Configuration**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 30 * 60 * 1000, // 30 minutes
         refetchOnWindowFocus: true,
         retry: 3,
       },
     },
   });
   ```

2. **Provider Setup**
   ```typescript
   function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <ReactQueryDevtools initialIsOpen={false} />
         {/* Rest of the application */}
       </QueryClientProvider>
     );
   }
   ```

3. **Custom Hooks for Content Types**
   ```typescript
   // Concepts
   export function useConceptsQuery(params?: QueryParams) {
     return useQuery(['concepts', params], () => fetchConcepts(params), {
       keepPreviousData: true,
     });
   }

   // Predicates
   export function usePredicatesQuery(params?: QueryParams) {
     return useQuery(['predicates', params], () => fetchPredicates(params), {
       keepPreviousData: true,
     });
   }

   // Resources
   export function useResourcesQuery(params?: QueryParams) {
     return useQuery(['resources', params], () => fetchResources(params), {
       keepPreviousData: true,
     });
   }

   // Topics
   export function useTopicsQuery(params?: QueryParams) {
     return useQuery(['topics', params], () => fetchTopics(params), {
       keepPreviousData: true,
     });
   }
   ```

4. **Mutation Hooks**
   ```typescript
   // Create
   export function useCreateConceptMutation() {
     return useMutation(createConcept, {
       onSuccess: () => {
         queryClient.invalidateQueries('concepts');
       },
     });
   }

   // Update
   export function useUpdateConceptMutation() {
     return useMutation(updateConcept, {
       onSuccess: (data, variables) => {
         queryClient.invalidateQueries(['concepts', variables.id]);
         queryClient.invalidateQueries('concepts');
       },
     });
   }

   // Delete
   export function useDeleteConceptMutation() {
     return useMutation(deleteConcept, {
       onSuccess: () => {
         queryClient.invalidateQueries('concepts');
       },
     });
   }
   ```

### Integration with MCP Server

1. **API Client Refactoring**
   ```typescript
   // Base fetch function
   async function fetchFromMCP<T>(method: string, params: any): Promise<T> {
     const response = await mcpClient({
       id: `${method}-${Date.now()}`,
       method,
       params,
       jsonrpc: '2.0',
     });

     if (response.error) {
       throw new Error(response.error.message);
     }

     return response.result as T;
   }

   // Content type specific functions
   export function fetchConcepts(params?: QueryParams) {
     return fetchFromMCP<Concept[]>('listConcepts', params || {});
   }

   export function fetchPredicates(params?: QueryParams) {
     return fetchFromMCP<Predicate[]>('listPredicates', params || {});
   }

   export function fetchResources(params?: QueryParams) {
     return fetchFromMCP<Resource[]>('listResources', params || {});
   }

   export function fetchTopics(params?: QueryParams) {
     return fetchFromMCP<Topic[]>('listTopics', params || {});
   }
   ```

## Implementation Plan

1. **Phase 1: Setup and Configuration**
   - Install React Query dependencies
   - Configure QueryClient
   - Set up QueryClientProvider
   - Add ReactQueryDevtools for development

2. **Phase 2: API Client Refactoring**
   - Refactor mcpClient to work with React Query
   - Create base fetch function
   - Implement content type specific fetch functions
   - Add error handling and type safety

3. **Phase 3: Custom Hooks Implementation**
   - Create query hooks for each content type
   - Implement mutation hooks for CRUD operations
   - Add pagination support
   - Implement optimistic updates

4. **Phase 4: Component Migration**
   - Update ContentList component to use React Query
   - Refactor page components to use custom hooks
   - Replace MCPClientProvider with QueryClientProvider
   - Update tests to work with React Query

5. **Phase 5: Testing and Validation**
   - Write unit tests for custom hooks
   - Test integration with MCP server
   - Validate performance improvements
   - Ensure backward compatibility

## Success Criteria

1. All components successfully migrated to React Query
2. Performance improvements in data fetching and caching
3. Reduced network requests through effective caching
4. Improved developer experience with custom hooks
5. Full TypeScript support with type safety
6. Comprehensive test coverage for all new functionality
7. Zero linting warnings or errors
8. Successful integration with existing codebase

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking changes in component interfaces | Provide backward compatibility layer during migration |
| Performance degradation with large datasets | Implement pagination and selective query invalidation |
| Increased bundle size | Use tree-shaking and code splitting to minimize impact |
| Learning curve for developers | Provide comprehensive documentation and examples |

## Dependencies

- @tanstack/react-query: ^5.0.0
- @tanstack/react-query-devtools: ^5.0.0

## References

- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Examples](https://tanstack.com/query/latest/docs/react/examples/basic)
- [React Query TypeScript](https://tanstack.com/query/latest/docs/react/typescript)
