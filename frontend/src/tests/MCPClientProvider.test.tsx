import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MCPClientProvider, useMCPClient } from '../components/MCPClientProvider';
import { mcpClient } from '../api/client';
import { createMockMCPRequest, createMockMCPResponse, createMockMCPErrorResponse } from '../utils/test-utils';

jest.mock('../api/client');
const mockedMcpClient = mcpClient as jest.MockedFunction<typeof mcpClient>;

function TestComponent(): React.ReactElement {
  const { loading, error, executeRequest, clearError } = useMCPClient();
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      {error && <div data-testid="error-message">{error}</div>}
      <button 
        data-testid="execute-request-button" 
        onClick={async () => {
          try {
            await executeRequest(createMockMCPRequest('testMethod', { test: 'data' }));
          } catch {
          }
        }}
      >
        Execute Request
      </button>
      <button data-testid="clear-error-button" onClick={clearError}>
        Clear Error
      </button>
    </div>
  );
}

describe('MCPClientProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should provide loading state and executeRequest function', async () => {
    const mockResponse = createMockMCPResponse('test-id', { success: true });
    mockedMcpClient.mockResolvedValueOnce(mockResponse);
    
    render(
      <MCPClientProvider>
        <TestComponent />
      </MCPClientProvider>
    );
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    
    act(() => {
      screen.getByTestId('execute-request-button').click();
    });
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    expect(mockedMcpClient).toHaveBeenCalledWith({
      id: expect.any(String),
      method: 'testMethod',
      params: { test: 'data' },
      jsonrpc: '2.0'
    });
  });

  it('should handle API errors correctly', async () => {
    const mockErrorResponse = createMockMCPErrorResponse('test-id', 500, 'Internal Server Error');
    mockedMcpClient.mockResolvedValueOnce(mockErrorResponse);
    
    render(
      <MCPClientProvider>
        <TestComponent />
      </MCPClientProvider>
    );
    
    act(() => {
      screen.getByTestId('execute-request-button').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    expect(screen.getByTestId('error-message')).toHaveTextContent('Error: Internal Server Error');
    
    act(() => {
      screen.getByTestId('clear-error-button').click();
    });
    
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network Error');
    mockedMcpClient.mockImplementationOnce(() => Promise.reject(networkError));
    
    render(
      <MCPClientProvider>
        <TestComponent />
      </MCPClientProvider>
    );
    
    act(() => {
      screen.getByTestId('execute-request-button').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Request failed: Network Error');
    });
  });
});
