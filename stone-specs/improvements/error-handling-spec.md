# Error Handling Implementation Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: Global Error Boundary and Toast Notifications  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the implementation of a comprehensive error handling system for the UOR Content Management Client, including global error boundaries and toast notifications. The system will provide consistent error handling across the application, improve user experience, and simplify error management for developers.

## Requirements

1. **Core Functionality**
   - Implement global error boundary to catch and handle unhandled errors
   - Create toast notification system for user feedback
   - Provide consistent error handling patterns across the application
   - Support different error types and severity levels

2. **User Experience Requirements**
   - Display user-friendly error messages
   - Provide actionable feedback for recoverable errors
   - Maintain application state during error recovery
   - Ensure accessibility for all error notifications

3. **Developer Experience Requirements**
   - Simplify error handling with consistent patterns
   - Provide centralized error logging and monitoring
   - Support custom error types and handlers
   - Enable easy testing of error scenarios

4. **Integration Requirements**
   - Seamless integration with React Query error handling
   - Support for Chakra UI toast notifications
   - Compatibility with Next.js App Router
   - Integration with API layer abstraction

## User Stories

### As a developer, I want to:

1. Catch and handle unhandled errors with a global error boundary.
   ```tsx
   <ErrorBoundary fallback={<ErrorFallback />}>
     <App />
   </ErrorBoundary>
   ```

2. Display toast notifications for user feedback.
   ```tsx
   const { showToast } = useToast();
   
   showToast({
     title: 'Success',
     description: 'Concept created successfully',
     status: 'success',
   });
   ```

3. Handle API errors consistently across the application.
   ```tsx
   try {
     await api.createConcept(concept);
   } catch (error) {
     handleApiError(error);
   }
   ```

4. Log errors for monitoring and debugging.
   ```tsx
   try {
     await api.createConcept(concept);
   } catch (error) {
     logError('Failed to create concept', error);
   }
   ```

### As a user, I want to:

1. See clear and actionable error messages when something goes wrong.
2. Recover from errors without losing my work.
3. Receive confirmation when actions are completed successfully.
4. Understand what went wrong and how to fix it.

## Technical Specifications

### Error Boundary Implementation

1. **Global Error Boundary**
   ```tsx
   // components/ErrorBoundary.tsx
   import React, { Component, ErrorInfo, ReactNode } from 'react';
   import { Box, Heading, Text, Button, VStack, Code, useColorModeValue } from '@chakra-ui/react';

   interface ErrorBoundaryProps {
     children: ReactNode;
     fallback?: ReactNode;
   }

   interface ErrorBoundaryState {
     hasError: boolean;
     error: Error | null;
   }

   export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
     constructor(props: ErrorBoundaryProps) {
       super(props);
       this.state = { hasError: false, error: null };
     }

     static getDerivedStateFromError(error: Error): ErrorBoundaryState {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
       logError('Uncaught error:', error, errorInfo);
     }

     render(): ReactNode {
       if (this.state.hasError) {
         if (this.props.fallback) {
           return this.props.fallback;
         }

         return (
           <ErrorFallback 
             error={this.state.error} 
             resetErrorBoundary={() => this.setState({ hasError: false, error: null })} 
           />
         );
       }

       return this.props.children;
     }
   }

   interface ErrorFallbackProps {
     error: Error | null;
     resetErrorBoundary: () => void;
   }

   export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps): JSX.Element {
     const bgColor = useColorModeValue('gray.50', 'gray.900');
     const borderColor = useColorModeValue('red.500', 'red.300');

     return (
       <Box
         p={8}
         maxW="800px"
         mx="auto"
         my={8}
         borderWidth="1px"
         borderRadius="lg"
         borderColor={borderColor}
         bg={bgColor}
       >
         <VStack spacing={4} align="stretch">
           <Heading size="lg" color="red.500">Something went wrong</Heading>
           <Text>An error occurred in the application. Our team has been notified.</Text>
           
           {error && (
             <Box p={4} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md">
               <Heading size="sm" mb={2}>Error details:</Heading>
               <Text fontFamily="mono">{error.message}</Text>
               {error.stack && (
                 <Code mt={2} p={2} display="block" whiteSpace="pre-wrap">
                   {error.stack}
                 </Code>
               )}
             </Box>
           )}
           
           <Button colorScheme="blue" onClick={resetErrorBoundary}>
             Try again
           </Button>
         </VStack>
       </Box>
     );
   }

   function logError(message: string, error: Error, errorInfo?: ErrorInfo): void {
     console.error(message, error, errorInfo);
     // In production, send to error monitoring service
   }
   ```

2. **Error Boundary Usage**
   ```tsx
   // app/layout.tsx
   import { ErrorBoundary } from '../components/ErrorBoundary';
   import { ChakraProvider } from '@chakra-ui/react';
   import { ToastProvider } from '../components/ToastProvider';

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <body>
           <ChakraProvider>
             <ToastProvider>
               <ErrorBoundary>
                 {children}
               </ErrorBoundary>
             </ToastProvider>
           </ChakraProvider>
         </body>
       </html>
     );
   }
   ```

### Toast Notification System

1. **Toast Provider**
   ```tsx
   // components/ToastProvider.tsx
   import React, { createContext, useContext, ReactNode } from 'react';
   import { useToast as useChakraToast, UseToastOptions } from '@chakra-ui/react';

   interface ToastContextType {
     showToast: (options: UseToastOptions) => void;
     showSuccessToast: (title: string, description?: string) => void;
     showErrorToast: (title: string, description?: string) => void;
     showWarningToast: (title: string, description?: string) => void;
     showInfoToast: (title: string, description?: string) => void;
   }

   const ToastContext = createContext<ToastContextType | undefined>(undefined);

   export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
     const chakraToast = useChakraToast();

     const showToast = (options: UseToastOptions) => {
       chakraToast({
         position: 'top-right',
         duration: 5000,
         isClosable: true,
         ...options,
       });
     };

     const showSuccessToast = (title: string, description?: string) => {
       showToast({
         title,
         description,
         status: 'success',
       });
     };

     const showErrorToast = (title: string, description?: string) => {
       showToast({
         title,
         description,
         status: 'error',
       });
     };

     const showWarningToast = (title: string, description?: string) => {
       showToast({
         title,
         description,
         status: 'warning',
       });
     };

     const showInfoToast = (title: string, description?: string) => {
       showToast({
         title,
         description,
         status: 'info',
       });
     };

     const value = {
       showToast,
       showSuccessToast,
       showErrorToast,
       showWarningToast,
       showInfoToast,
     };

     return (
       <ToastContext.Provider value={value}>
         {children}
       </ToastContext.Provider>
     );
   }

   export function useToast(): ToastContextType {
     const context = useContext(ToastContext);
     if (context === undefined) {
       throw new Error('useToast must be used within a ToastProvider');
     }
     return context;
   }
   ```

2. **Toast Usage**
   ```tsx
   // components/ConceptForm.tsx
   import { useState } from 'react';
   import { useToast } from '../components/ToastProvider';
   import { useCreateConcept } from '../hooks/useConcepts';

   export default function ConceptForm() {
     const [name, setName] = useState('');
     const [description, setDescription] = useState('');
     const { showSuccessToast, showErrorToast } = useToast();
     const { mutate, isLoading } = useCreateConcept();

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       
       try {
         await mutate({ name, description });
         showSuccessToast('Concept created', 'The concept was created successfully');
         setName('');
         setDescription('');
       } catch (error) {
         showErrorToast(
           'Failed to create concept',
           error instanceof Error ? error.message : 'An unknown error occurred'
         );
       }
     };

     // Form JSX
   }
   ```

### API Error Handling

1. **API Error Types**
   ```typescript
   // types/errors.ts
   export enum ErrorCode {
     UNAUTHORIZED = 'UNAUTHORIZED',
     FORBIDDEN = 'FORBIDDEN',
     NOT_FOUND = 'NOT_FOUND',
     VALIDATION_ERROR = 'VALIDATION_ERROR',
     SERVER_ERROR = 'SERVER_ERROR',
     NETWORK_ERROR = 'NETWORK_ERROR',
     UNKNOWN_ERROR = 'UNKNOWN_ERROR',
   }

   export interface ApiError {
     code: ErrorCode;
     message: string;
     details?: Record<string, any>;
   }

   export class AppError extends Error {
     code: ErrorCode;
     details?: Record<string, any>;

     constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
       super(message);
       this.name = 'AppError';
       this.code = code;
       this.details = details;
     }
   }
   ```

2. **Error Handler Utility**
   ```typescript
   // utils/errorHandler.ts
   import { AppError, ErrorCode } from '../types/errors';

   export function handleApiError(error: unknown): AppError {
     if (error instanceof AppError) {
       return error;
     }

     if (error instanceof Error) {
       // Parse error message to determine type
       if (error.message.includes('401')) {
         return new AppError(ErrorCode.UNAUTHORIZED, 'You are not authorized to perform this action');
       }
       
       if (error.message.includes('403')) {
         return new AppError(ErrorCode.FORBIDDEN, 'You do not have permission to perform this action');
       }
       
       if (error.message.includes('404')) {
         return new AppError(ErrorCode.NOT_FOUND, 'The requested resource was not found');
       }
       
       if (error.message.includes('validation')) {
         return new AppError(ErrorCode.VALIDATION_ERROR, 'Validation error', { originalError: error });
       }
       
       if (error.message.includes('network')) {
         return new AppError(ErrorCode.NETWORK_ERROR, 'Network error. Please check your connection');
       }
       
       return new AppError(ErrorCode.UNKNOWN_ERROR, error.message, { originalError: error });
     }

     return new AppError(ErrorCode.UNKNOWN_ERROR, 'An unknown error occurred');
   }

   export function getUserFriendlyErrorMessage(error: unknown): string {
     const appError = handleApiError(error);
     
     switch (appError.code) {
       case ErrorCode.UNAUTHORIZED:
         return 'Please log in to continue';
       case ErrorCode.FORBIDDEN:
         return 'You do not have permission to perform this action';
       case ErrorCode.NOT_FOUND:
         return 'The requested resource could not be found';
       case ErrorCode.VALIDATION_ERROR:
         return 'Please check your input and try again';
       case ErrorCode.NETWORK_ERROR:
         return 'Network error. Please check your connection and try again';
       case ErrorCode.SERVER_ERROR:
         return 'Server error. Our team has been notified';
       default:
         return appError.message || 'An unknown error occurred';
     }
   }
   ```

3. **Integration with React Query**
   ```typescript
   // hooks/useConcepts.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { fetchConcepts, createConcept } from '../api/services';
   import { handleApiError } from '../utils/errorHandler';
   import { useToast } from '../components/ToastProvider';

   export function useConcepts() {
     const { showErrorToast } = useToast();
     
     return useQuery({
       queryKey: ['concepts'],
       queryFn: fetchConcepts,
       onError: (error) => {
         const appError = handleApiError(error);
         showErrorToast('Failed to fetch concepts', appError.message);
       },
     });
   }

   export function useCreateConcept() {
     const queryClient = useQueryClient();
     const { showSuccessToast, showErrorToast } = useToast();
     
     return useMutation({
       mutationFn: createConcept,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['concepts'] });
         showSuccessToast('Concept created', 'The concept was created successfully');
       },
       onError: (error) => {
         const appError = handleApiError(error);
         showErrorToast('Failed to create concept', appError.message);
       },
     });
   }
   ```

## Implementation Plan

1. **Phase 1: Error Types and Utilities**
   - Define error types and codes
   - Create error handling utilities
   - Implement user-friendly error messages
   - Set up error logging infrastructure

2. **Phase 2: Toast Notification System**
   - Implement ToastProvider
   - Create toast utility hooks
   - Add toast components for different statuses
   - Ensure accessibility for notifications

3. **Phase 3: Global Error Boundary**
   - Implement ErrorBoundary component
   - Create fallback UI for different error scenarios
   - Add error recovery mechanisms
   - Integrate with error logging

4. **Phase 4: API Error Integration**
   - Update API client to use error handling
   - Integrate with React Query error handling
   - Implement consistent error patterns
   - Add error handling to custom hooks

5. **Phase 5: Testing and Validation**
   - Write unit tests for error handling
   - Test error boundary with simulated errors
   - Validate toast notifications
   - Ensure proper error recovery

## Success Criteria

1. All unhandled errors are caught by the global error boundary
2. User-friendly error messages are displayed for all error scenarios
3. Toast notifications provide clear feedback for user actions
4. Consistent error handling patterns across the application
5. Proper error recovery without data loss
6. Comprehensive test coverage for error scenarios
7. Zero linting warnings or errors
8. Successful integration with React Query and Chakra UI

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Overwhelming users with too many notifications | Implement notification grouping and prioritization |
| Performance impact of error boundary | Use selective error boundaries for critical components |
| Inconsistent error handling | Provide centralized error handling utilities |
| Missing error scenarios | Comprehensive testing of edge cases |

## Dependencies

- @chakra-ui/react: ^2.8.0
- @tanstack/react-query: ^5.0.0
- TypeScript: ^5.0.0
- Next.js: ^15.0.0

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Chakra UI Toast](https://chakra-ui.com/docs/components/toast)
- [React Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/error-handling)
