# API Layer Abstraction Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: API Layer Abstraction with Custom Hooks  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the implementation of an abstracted API layer with custom hooks for different content types in the UOR Content Management Client. The API layer will provide a consistent interface for interacting with the MCP server, simplifying data fetching, mutation, and error handling across the application.

## Requirements

1. **Core Functionality**
   - Create a unified API client for MCP server communication
   - Implement custom hooks for each content type (concepts, predicates, resources, topics)
   - Provide consistent error handling and loading states
   - Support pagination, filtering, and sorting

2. **Developer Experience**
   - Simplify data fetching with type-safe hooks
   - Reduce boilerplate code for API interactions
   - Provide consistent patterns for error handling
   - Enable easy mocking for testing

3. **Performance Requirements**
   - Optimize request batching for related data
   - Implement request deduplication
   - Support cancellation of in-flight requests
   - Minimize unnecessary re-renders

4. **Integration Requirements**
   - Seamless integration with React Query
   - Support for Chakra UI components
   - Compatibility with Next.js App Router
   - Type safety with TypeScript

## User Stories

### As a developer, I want to:

1. Fetch data using content-specific hooks to simplify API interactions.
   ```typescript
   const { data, isLoading, error } = useConcepts();
   ```

2. Filter, sort, and paginate data using hook parameters.
   ```typescript
   const { data, isLoading, error } = useConcepts({
     filter: { name: 'example' },
     sort: { field: 'name', order: 'asc' },
     pagination: { page: 1, limit: 10 },
   });
   ```

3. Create, update, and delete content using mutation hooks.
   ```typescript
   const { mutate, isLoading, error } = useCreateConcept();
   mutate({ name: 'New Concept', description: 'Description' });
   ```

4. Access individual content items by ID.
   ```typescript
   const { data, isLoading, error } = useConceptById('concept-123');
   ```

### As a user, I want to:

1. Experience consistent loading states across the application.
2. See clear error messages when API requests fail.
3. Navigate paginated content efficiently.
4. Filter and sort content to find relevant information quickly.

## Technical Specifications

### API Client Architecture

1. **Base API Client**
   ```typescript
   // api/client.ts
   export interface MCPRequest<T = any> {
     id: string;
     method: string;
     params: T;
     jsonrpc: string;
   }

   export interface MCPResponse<T = any> {
     id: string;
     result?: T;
     error?: {
       code: number;
       message: string;
     };
     jsonrpc: string;
   }

   export async function mcpClient<T = any, R = any>(request: MCPRequest<T>): Promise<MCPResponse<R>> {
     const response = await fetch('/api/mcp', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(request),
     });

     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }

     return response.json();
   }
   ```

2. **Content Type API Functions**
   ```typescript
   // api/services.ts
   import { mcpClient } from './client';
   import type { Concept, Predicate, Resource, Topic } from '../types/shared';

   // Concepts
   export async function fetchConcepts(params?: any): Promise<Concept[]> {
     const response = await mcpClient({
       id: `list-concepts-${Date.now()}`,
       method: 'listConcepts',
       params: params || {},
       jsonrpc: '2.0',
     });

     if (response.error) {
       throw new Error(response.error.message);
     }

     return response.result;
   }

   export async function fetchConceptById(id: string): Promise<Concept> {
     const response = await mcpClient({
       id: `get-concept-${id}-${Date.now()}`,
       method: 'getConcept',
       params: { id },
       jsonrpc: '2.0',
     });

     if (response.error) {
       throw new Error(response.error.message);
     }

     return response.result;
   }

   export async function createConcept(concept: Partial<Concept>): Promise<Concept> {
     const response = await mcpClient({
       id: `create-concept-${Date.now()}`,
       method: 'createConcept',
       params: concept,
       jsonrpc: '2.0',
     });

     if (response.error) {
       throw new Error(response.error.message);
     }

     return response.result;
   }

   export async function updateConcept(concept: Partial<Concept>): Promise<Concept> {
     const response = await mcpClient({
       id: `update-concept-${Date.now()}`,
       method: 'updateConcept',
       params: concept,
       jsonrpc: '2.0',
     });

     if (response.error) {
       throw new Error(response.error.message);
     }

     return response.result;
   }

   export async function deleteConcept(id: string): Promise<boolean> {
     const response = await mcpClient({
       id: `delete-concept-${Date.now()}`,
       method: 'deleteConcept',
       params: { id },
       jsonrpc: '2.0',
     });

     if (response.error) {
       throw new Error(response.error.message);
     }

     return response.result;
   }

   // Similar functions for Predicates, Resources, and Topics
   ```

3. **Custom Hooks**
   ```typescript
   // hooks/useConcepts.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { fetchConcepts, fetchConceptById, createConcept, updateConcept, deleteConcept } from '../api/services';
   import type { Concept } from '../types/shared';

   export interface UseConceptsOptions {
     filter?: Record<string, any>;
     sort?: {
       field: string;
       order: 'asc' | 'desc';
     };
     pagination?: {
       page: number;
       limit: number;
     };
   }

   export function useConcepts(options?: UseConceptsOptions) {
     return useQuery({
       queryKey: ['concepts', options],
       queryFn: () => fetchConcepts(options),
     });
   }

   export function useConceptById(id: string) {
     return useQuery({
       queryKey: ['concept', id],
       queryFn: () => fetchConceptById(id),
       enabled: !!id,
     });
   }

   export function useCreateConcept() {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: (concept: Partial<Concept>) => createConcept(concept),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['concepts'] });
       },
     });
   }

   export function useUpdateConcept() {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: (concept: Partial<Concept>) => updateConcept(concept),
       onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: ['concepts'] });
         queryClient.invalidateQueries({ queryKey: ['concept', data.id] });
       },
     });
   }

   export function useDeleteConcept() {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: (id: string) => deleteConcept(id),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['concepts'] });
       },
     });
   }
   ```

4. **Hook Usage in Components**
   ```tsx
   // components/ConceptsList.tsx
   import { Box, Heading, Text, VStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
   import { useConcepts } from '../hooks/useConcepts';

   export default function ConceptsList() {
     const { data, isLoading, error } = useConcepts({
       pagination: { page: 1, limit: 10 },
       sort: { field: 'name', order: 'asc' },
     });

     if (isLoading) {
       return (
         <Box textAlign="center" py={10}>
           <Spinner size="xl" />
           <Text mt={4}>Loading concepts...</Text>
         </Box>
       );
     }

     if (error) {
       return (
         <Alert status="error">
           <AlertIcon />
           {error instanceof Error ? error.message : 'An error occurred'}
         </Alert>
       );
     }

     return (
       <VStack spacing={4} align="stretch">
         <Heading size="md">Concepts</Heading>
         {data && data.map((concept) => (
           <Box key={concept.id} p={4} borderWidth="1px" borderRadius="md">
             <Heading size="sm">{concept.name}</Heading>
             <Text mt={2}>{concept.description}</Text>
           </Box>
         ))}
       </VStack>
     );
   }
   ```

## Implementation Plan

1. **Phase 1: API Client Refactoring**
   - Refactor the base MCP client
   - Implement error handling and request validation
   - Add request cancellation support
   - Create TypeScript interfaces for all API models

2. **Phase 2: Service Functions**
   - Create service functions for each content type
   - Implement CRUD operations for all content types
   - Add support for filtering, sorting, and pagination
   - Ensure proper error handling and type safety

3. **Phase 3: Custom Hooks**
   - Create query hooks for fetching data
   - Implement mutation hooks for CRUD operations
   - Add support for React Query features
   - Ensure proper cache invalidation

4. **Phase 4: Component Integration**
   - Update components to use custom hooks
   - Implement loading and error states
   - Add pagination, filtering, and sorting UI
   - Ensure proper TypeScript integration

5. **Phase 5: Testing and Validation**
   - Write unit tests for API client and services
   - Test custom hooks with React Testing Library
   - Validate integration with components
   - Ensure proper error handling and edge cases

## Success Criteria

1. All components successfully migrated to use custom hooks
2. Consistent error handling across the application
3. Support for pagination, filtering, and sorting
4. Reduced boilerplate code for API interactions
5. Improved developer experience with type-safe hooks
6. Comprehensive test coverage for all API functions and hooks
7. Zero linting warnings or errors
8. Successful integration with React Query and Chakra UI

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking changes in API interfaces | Provide backward compatibility layer during migration |
| Performance degradation with complex queries | Implement request batching and deduplication |
| Increased complexity for simple use cases | Provide simplified hooks for common operations |
| Learning curve for developers | Create comprehensive documentation and examples |

## Dependencies

- @tanstack/react-query: ^5.0.0
- TypeScript: ^5.0.0
- Next.js: ^15.0.0

## References

- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
