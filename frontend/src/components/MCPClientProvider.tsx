'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mcpClient } from '../api/client';
import { MCPRequest, MCPResponse } from '../types/shared';

interface MCPClientContextType {
  loading: boolean;
  error: string | null;
  executeRequest: <T>(request: MCPRequest) => Promise<MCPResponse<T>>;
  clearError: () => void;
}

const MCPClientContext = createContext<MCPClientContextType | undefined>(undefined);

export function useMCPClient() {
  const context = useContext(MCPClientContext);
  if (!context) {
    throw new Error('useMCPClient must be used within an MCPClientProvider');
  }
  return context;
}

interface MCPClientProviderProps {
  children: ReactNode;
}

export function MCPClientProvider({ children }: MCPClientProviderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRequest = async <T,>(request: MCPRequest): Promise<MCPResponse<T>> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mcpClient<T>(request);
      
      if (response.error) {
        setError(`Error: ${response.error.message}`);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Request failed: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    loading,
    error,
    executeRequest,
    clearError
  };

  return (
    <MCPClientContext.Provider value={value}>
      {children}
    </MCPClientContext.Provider>
  );
}
