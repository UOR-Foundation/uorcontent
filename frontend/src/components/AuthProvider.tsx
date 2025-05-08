'use client';

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

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showErrorToast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        validateToken(token);
      } else {
        setIsLoading(false);
      }
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

      setUser((response.result as { user: User }).user);
      localStorage.setItem('auth_token', (response.result as { token: string }).token);
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

      setUser((response.result as { user: User }).user);
      localStorage.setItem('auth_token', (response.result as { token: string }).token);
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

      setUser((response.result as { user: User }).user);
      localStorage.setItem('auth_token', (response.result as { token: string }).token);
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
