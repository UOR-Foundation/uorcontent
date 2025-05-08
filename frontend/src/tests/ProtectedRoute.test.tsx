import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../components/AuthProvider';
import { ToastProvider } from '../components/ToastProvider';
import { mcpClient } from '../api/client';

jest.mock('../api/client', () => ({
  mcpClient: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/protected',
  useSearchParams: () => new URLSearchParams(),
}));

const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockPush.mockClear();
  });

  it('should render loading state initially', () => {
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' }, token: 'test-token' },
    });
    
    render(
      <ToastProvider>
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </ToastProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to login if not authenticated', async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fprotected');
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render children if authenticated', async () => {
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' }, token: 'test-token' },
    });
    
    localStorageMock.getItem.mockReturnValue('test-token');
    
    render(
      <ToastProvider>
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to unauthorized page if role requirement not met', async () => {
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' }, token: 'test-token' },
    });
    
    localStorageMock.getItem.mockReturnValue('test-token');
    
    render(
      <ToastProvider>
        <AuthProvider>
          <ProtectedRoute requiredRole="admin">
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render children if role requirement is met', async () => {
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'admin' }, token: 'test-token' },
    });
    
    localStorageMock.getItem.mockReturnValue('test-token');
    
    render(
      <ToastProvider>
        <AuthProvider>
          <ProtectedRoute requiredRole="admin">
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    expect(mockPush).not.toHaveBeenCalled();
  });
});
