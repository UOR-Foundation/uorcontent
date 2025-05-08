import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { ToastProvider } from '../components/ToastProvider';
import { mcpClient } from '../api/client';

jest.mock('../api/client', () => ({
  mcpClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
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

function TestComponent() {
  const { user, isLoading, error, login, logout, register, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
      <button data-testid="login-btn" onClick={() => login('testuser', 'password')}>Login</button>
      <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
      <button data-testid="register-btn" onClick={() => register('testuser', 'test@example.com', 'password')}>Register</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should initialize with no user and not authenticated', () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should handle successful login', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: mockUser, token: 'test-token' },
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });

    expect(mcpClient).toHaveBeenCalledWith(expect.objectContaining({
      method: 'login',
      params: { username: 'testuser', password: 'password' },
    }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
  });

  it('should handle login error', async () => {
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      error: { code: 401, message: 'Invalid credentials' },
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    });
  });

  it('should handle successful registration', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: mockUser, token: 'test-token' },
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('register-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });

    expect(mcpClient).toHaveBeenCalledWith(expect.objectContaining({
      method: 'register',
      params: { username: 'testuser', email: 'test@example.com', password: 'password' },
    }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
  });

  it('should handle logout', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: mockUser, token: 'test-token' },
    });

    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { success: true },
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('should validate token on mount if one exists', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
    localStorageMock.getItem.mockReturnValueOnce('existing-token');
    
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      result: { user: mockUser, token: 'refreshed-token' },
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });

    expect(mcpClient).toHaveBeenCalledWith(expect.objectContaining({
      method: 'validateToken',
      params: { token: 'existing-token' },
    }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'refreshed-token');
  });

  it('should handle invalid token on mount', async () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid-token');
    
    (mcpClient as jest.Mock).mockResolvedValueOnce({
      error: { code: 401, message: 'Invalid token' },
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid token');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });
});
