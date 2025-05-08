# Authentication Integration Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: Authentication Integration with MCP Server  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the implementation of authentication integration with the MCP server for the UOR Content Management Client. The authentication system will provide secure access to protected resources, user-specific content, and administrative functions while maintaining a seamless user experience.

## Requirements

1. **Core Functionality**
   - Implement authentication with the MCP server
   - Create login and registration flows
   - Support session management and token-based authentication
   - Implement secure storage of authentication tokens

2. **User Experience Requirements**
   - Provide intuitive login and registration forms
   - Implement protected routes for authenticated users
   - Support persistent login across sessions
   - Display appropriate feedback for authentication errors

3. **Security Requirements**
   - Implement secure token storage
   - Support token refresh and expiration
   - Protect against common security vulnerabilities
   - Implement proper logout functionality

4. **Integration Requirements**
   - Seamless integration with React Query for authenticated requests
   - Support for Chakra UI components
   - Compatibility with Next.js App Router
   - Integration with error handling system

## User Stories

### As a developer, I want to:

1. Protect routes that require authentication.
   ```tsx
   <ProtectedRoute>
     <AdminDashboard />
   </ProtectedRoute>
   ```

2. Access the current user's information.
   ```tsx
   const { user, isLoading } = useCurrentUser();
   ```

3. Make authenticated API requests.
   ```tsx
   const { data } = useAuthenticatedQuery('protected-resource');
   ```

4. Handle authentication errors consistently.
   ```tsx
   const { login, error } = useAuth();
   ```

### As a user, I want to:

1. Log in to access protected content.
2. Stay logged in across sessions.
3. Log out securely when finished.
4. Receive clear feedback for authentication errors.

## Technical Specifications

### Authentication Provider

1. **Auth Provider Implementation**
   ```tsx
   // components/AuthProvider.tsx
   import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
   import { useRouter } from 'next/navigation';
   import { mcpClient } from '../api/client';
   import { useToast } from './ToastProvider';

   interface User {
     id: string;
     username: string;
     email: string;
     role: string;
   }

   interface AuthContextType {
     user: User | null;
     isLoading: boolean;
     error: string | null;
     login: (username: string, password: string) => Promise<void>;
     logout: () => Promise<void>;
     register: (username: string, email: string, password: string) => Promise<void>;
     isAuthenticated: boolean;
   }

   const AuthContext = createContext<AuthContextType | undefined>(undefined);

   export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
     const [user, setUser] = useState<User | null>(null);
     const [isLoading, setIsLoading] = useState<boolean>(true);
     const [error, setError] = useState<string | null>(null);
     const router = useRouter();
     const { showErrorToast } = useToast();

     useEffect(() => {
       // Check for existing token and validate on mount
       const token = localStorage.getItem('auth_token');
       if (token) {
         validateToken(token);
       } else {
         setIsLoading(false);
       }
     }, []);

     const validateToken = async (token: string) => {
       try {
         setIsLoading(true);
         const response = await mcpClient({
           id: `validate-token-${Date.now()}`,
           method: 'validateToken',
           params: { token },
           jsonrpc: '2.0',
         });

         if (response.error) {
           throw new Error(response.error.message);
         }

         setUser(response.result.user);
         localStorage.setItem('auth_token', response.result.token);
       } catch (error) {
         localStorage.removeItem('auth_token');
         setError(error instanceof Error ? error.message : 'Authentication failed');
         showErrorToast('Authentication failed', 'Your session has expired. Please log in again.');
       } finally {
         setIsLoading(false);
       }
     };

     const login = async (username: string, password: string) => {
       try {
         setIsLoading(true);
         setError(null);
         
         const response = await mcpClient({
           id: `login-${Date.now()}`,
           method: 'login',
           params: { username, password },
           jsonrpc: '2.0',
         });

         if (response.error) {
           throw new Error(response.error.message);
         }

         setUser(response.result.user);
         localStorage.setItem('auth_token', response.result.token);
         router.push('/');
       } catch (error) {
         setError(error instanceof Error ? error.message : 'Login failed');
         showErrorToast('Login failed', error instanceof Error ? error.message : 'Invalid credentials');
       } finally {
         setIsLoading(false);
       }
     };

     const logout = async () => {
       try {
         setIsLoading(true);
         const token = localStorage.getItem('auth_token');
         
         if (token) {
           await mcpClient({
             id: `logout-${Date.now()}`,
             method: 'logout',
             params: { token },
             jsonrpc: '2.0',
           });
         }
       } catch (error) {
         showErrorToast('Logout error', error instanceof Error ? error.message : 'Error during logout');
       } finally {
         localStorage.removeItem('auth_token');
         setUser(null);
         setIsLoading(false);
         router.push('/login');
       }
     };

     const register = async (username: string, email: string, password: string) => {
       try {
         setIsLoading(true);
         setError(null);
         
         const response = await mcpClient({
           id: `register-${Date.now()}`,
           method: 'register',
           params: { username, email, password },
           jsonrpc: '2.0',
         });

         if (response.error) {
           throw new Error(response.error.message);
         }

         setUser(response.result.user);
         localStorage.setItem('auth_token', response.result.token);
         router.push('/');
       } catch (error) {
         setError(error instanceof Error ? error.message : 'Registration failed');
         showErrorToast('Registration failed', error instanceof Error ? error.message : 'Invalid information');
       } finally {
         setIsLoading(false);
       }
     };

     const value = {
       user,
       isLoading,
       error,
       login,
       logout,
       register,
       isAuthenticated: !!user,
     };

     return (
       <AuthContext.Provider value={value}>
         {children}
       </AuthContext.Provider>
     );
   }

   export function useAuth(): AuthContextType {
     const context = useContext(AuthContext);
     if (context === undefined) {
       throw new Error('useAuth must be used within an AuthProvider');
     }
     return context;
   }
   ```

2. **Auth Provider Usage**
   ```tsx
   // app/layout.tsx
   import { AuthProvider } from '../components/AuthProvider';
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
               <AuthProvider>
                 {children}
               </AuthProvider>
             </ToastProvider>
           </ChakraProvider>
         </body>
       </html>
     );
   }
   ```

### Protected Routes

1. **Protected Route Component**
   ```tsx
   // components/ProtectedRoute.tsx
   import { useEffect } from 'react';
   import { useRouter, usePathname } from 'next/navigation';
   import { useAuth } from './AuthProvider';
   import { Box, Spinner, Center } from '@chakra-ui/react';

   interface ProtectedRouteProps {
     children: React.ReactNode;
     requiredRole?: string;
   }

   export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): JSX.Element {
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
         <Center h="100vh">
           <Spinner size="xl" />
         </Center>
       );
     }

     if (!isAuthenticated) {
       return <Box display="none" />;
     }

     if (requiredRole && user?.role !== requiredRole) {
       return <Box display="none" />;
     }

     return <>{children}</>;
   }
   ```

2. **Protected Route Usage**
   ```tsx
   // app/admin/page.tsx
   import ProtectedRoute from '../../components/ProtectedRoute';
   import AdminDashboard from '../../components/AdminDashboard';

   export default function AdminPage() {
     return (
       <ProtectedRoute requiredRole="admin">
         <AdminDashboard />
       </ProtectedRoute>
     );
   }
   ```

### Authentication Forms

1. **Login Form**
   ```tsx
   // components/LoginForm.tsx
   import { useState } from 'react';
   import { useAuth } from './AuthProvider';
   import { useSearchParams } from 'next/navigation';
   import {
     Box,
     Button,
     FormControl,
     FormLabel,
     Input,
     VStack,
     Heading,
     Text,
     Link,
     Alert,
     AlertIcon,
   } from '@chakra-ui/react';
   import NextLink from 'next/link';

   export default function LoginForm(): JSX.Element {
     const [username, setUsername] = useState('');
     const [password, setPassword] = useState('');
     const { login, isLoading, error } = useAuth();
     const searchParams = useSearchParams();
     const redirect = searchParams?.get('redirect') || '/';

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       await login(username, password);
     };

     return (
       <Box maxW="md" mx="auto" mt={8} p={6} borderWidth="1px" borderRadius="lg">
         <VStack spacing={4} align="stretch">
           <Heading size="lg" textAlign="center">Log In</Heading>
           
           {error && (
             <Alert status="error" borderRadius="md">
               <AlertIcon />
               {error}
             </Alert>
           )}
           
           <form onSubmit={handleSubmit}>
             <VStack spacing={4}>
               <FormControl isRequired>
                 <FormLabel>Username</FormLabel>
                 <Input
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
               </FormControl>
               
               <FormControl isRequired>
                 <FormLabel>Password</FormLabel>
                 <Input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </FormControl>
               
               <Button
                 type="submit"
                 colorScheme="blue"
                 width="full"
                 isLoading={isLoading}
                 loadingText="Logging in"
               >
                 Log In
               </Button>
             </VStack>
           </form>
           
           <Text textAlign="center">
             Don't have an account?{' '}
             <Link as={NextLink} href="/register" color="blue.500">
               Register
             </Link>
           </Text>
         </VStack>
       </Box>
     );
   }
   ```

2. **Registration Form**
   ```tsx
   // components/RegisterForm.tsx
   import { useState } from 'react';
   import { useAuth } from './AuthProvider';
   import {
     Box,
     Button,
     FormControl,
     FormLabel,
     Input,
     VStack,
     Heading,
     Text,
     Link,
     Alert,
     AlertIcon,
   } from '@chakra-ui/react';
   import NextLink from 'next/link';

   export default function RegisterForm(): JSX.Element {
     const [username, setUsername] = useState('');
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [passwordError, setPasswordError] = useState('');
     const { register, isLoading, error } = useAuth();

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       
       if (password !== confirmPassword) {
         setPasswordError('Passwords do not match');
         return;
       }
       
       setPasswordError('');
       await register(username, email, password);
     };

     return (
       <Box maxW="md" mx="auto" mt={8} p={6} borderWidth="1px" borderRadius="lg">
         <VStack spacing={4} align="stretch">
           <Heading size="lg" textAlign="center">Register</Heading>
           
           {error && (
             <Alert status="error" borderRadius="md">
               <AlertIcon />
               {error}
             </Alert>
           )}
           
           <form onSubmit={handleSubmit}>
             <VStack spacing={4}>
               <FormControl isRequired>
                 <FormLabel>Username</FormLabel>
                 <Input
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
               </FormControl>
               
               <FormControl isRequired>
                 <FormLabel>Email</FormLabel>
                 <Input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                 />
               </FormControl>
               
               <FormControl isRequired>
                 <FormLabel>Password</FormLabel>
                 <Input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </FormControl>
               
               <FormControl isRequired isInvalid={!!passwordError}>
                 <FormLabel>Confirm Password</FormLabel>
                 <Input
                   type="password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                 />
                 {passwordError && (
                   <Text color="red.500" fontSize="sm" mt={1}>
                     {passwordError}
                   </Text>
                 )}
               </FormControl>
               
               <Button
                 type="submit"
                 colorScheme="blue"
                 width="full"
                 isLoading={isLoading}
                 loadingText="Registering"
               >
                 Register
               </Button>
             </VStack>
           </form>
           
           <Text textAlign="center">
             Already have an account?{' '}
             <Link as={NextLink} href="/login" color="blue.500">
               Log In
             </Link>
           </Text>
         </VStack>
       </Box>
     );
   }
   ```

### Authenticated API Requests

1. **API Client with Authentication**
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
     const token = localStorage.getItem('auth_token');
     
     const headers: Record<string, string> = {
       'Content-Type': 'application/json',
     };
     
     if (token && !request.method.includes('login') && !request.method.includes('register')) {
       headers['Authorization'] = `Bearer ${token}`;
     }
     
     const response = await fetch('/api/mcp', {
       method: 'POST',
       headers,
       body: JSON.stringify(request),
     });

     if (!response.ok) {
       if (response.status === 401) {
         localStorage.removeItem('auth_token');
         window.location.href = '/login';
         throw new Error('Authentication failed. Please log in again.');
       }
       throw new Error(`HTTP error! status: ${response.status}`);
     }

     return response.json();
   }
   ```

2. **React Query Integration**
   ```typescript
   // hooks/useAuthenticatedQuery.ts
   import { useQuery, UseQueryOptions } from '@tanstack/react-query';
   import { useAuth } from '../components/AuthProvider';
   import { useRouter } from 'next/navigation';

   export function useAuthenticatedQuery<TData, TError = unknown>(
     queryKey: unknown[],
     queryFn: () => Promise<TData>,
     options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
   ) {
     const { isAuthenticated } = useAuth();
     const router = useRouter();

     return useQuery<TData, TError>({
       queryKey,
       queryFn,
       ...options,
       enabled: isAuthenticated && (options?.enabled !== false),
       onError: (error) => {
         if (error instanceof Error && error.message.includes('Authentication failed')) {
           router.push('/login');
         }
         options?.onError?.(error);
       },
     });
   }
   ```

## Implementation Plan

1. **Phase 1: Authentication Provider**
   - Implement AuthProvider component
   - Create authentication hooks
   - Set up token storage and management
   - Implement login and registration logic

2. **Phase 2: Protected Routes**
   - Create ProtectedRoute component
   - Implement role-based access control
   - Add redirect logic for unauthenticated users
   - Create unauthorized page

3. **Phase 3: Authentication Forms**
   - Implement login form
   - Create registration form
   - Add form validation
   - Implement error handling

4. **Phase 4: API Integration**
   - Update API client for authentication
   - Implement authenticated query hooks
   - Add token refresh mechanism
   - Integrate with React Query

5. **Phase 5: Testing and Validation**
   - Write unit tests for authentication components
   - Test protected routes
   - Validate authentication flows
   - Ensure proper error handling

## Success Criteria

1. Users can register and log in successfully
2. Protected routes are only accessible to authenticated users
3. Role-based access control works correctly
4. Authentication tokens are securely stored and managed
5. API requests include authentication headers
6. Proper error handling for authentication failures
7. Comprehensive test coverage for authentication components
8. Zero linting warnings or errors
9. Successful integration with React Query and Chakra UI

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Token exposure | Use secure storage and HTTPS for all requests |
| Session hijacking | Implement token refresh and short expiration times |
| Cross-site scripting | Sanitize user inputs and use Content Security Policy |
| Authentication bypass | Implement server-side validation of tokens |

## Dependencies

- @tanstack/react-query: ^5.0.0
- @chakra-ui/react: ^2.8.0
- Next.js: ^15.0.0
- TypeScript: ^5.0.0

## References

- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [React Query Authentication](https://tanstack.com/query/latest/docs/react/guides/authentication)
- [OWASP Authentication Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
