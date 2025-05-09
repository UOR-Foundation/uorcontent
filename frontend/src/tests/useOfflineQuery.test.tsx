import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useOfflineQuery } from '../hooks/useOfflineQuery';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/ToastProvider';

jest.mock('../hooks/useOfflineStatus');

jest.mock('../components/ToastProvider', () => ({
  ...jest.requireActual('../components/ToastProvider'),
  useToast: () => ({
    showInfoToast: jest.fn(),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showWarningToast: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  
  Wrapper.displayName = 'QueryWrapper';
  return Wrapper;
};

describe('useOfflineQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return data from the query function when online', async () => {
    (useOfflineStatus as jest.Mock).mockReturnValue(false);
    
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(
      () => useOfflineQuery(['test'], mockQueryFn),
      { wrapper: createWrapper() }
    );
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isOffline).toBe(false);
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
  });
  
  it('should use cached data when offline', async () => {
    (useOfflineStatus as jest.Mock).mockReturnValue(true);
    
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(
      () => useOfflineQuery(['test-offline'], mockQueryFn),
      { wrapper: createWrapper() }
    );
    
    expect(result.current.isOffline).toBe(true);
    
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
  });
  
  it('should use custom options when provided', async () => {
    (useOfflineStatus as jest.Mock).mockReturnValue(false);
    
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockData);
    
    const customOptions = {
      staleTime: 10000,
      refetchOnWindowFocus: false,
    };
    
    const { result } = renderHook(
      () => useOfflineQuery(['test-options'], mockQueryFn, customOptions),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isOffline).toBe(false);
  });
  
  it('should override refetch options when offline', async () => {
    (useOfflineStatus as jest.Mock).mockReturnValue(true);
    
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockData);
    
    const customOptions = {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    };
    
    renderHook(
      () => useOfflineQuery(['test-refetch'], mockQueryFn, customOptions),
      { wrapper: createWrapper() }
    );
    
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    
  });
});
