import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ContentList from '../components/ContentList';
import { useMCPClient } from '../components/MCPClientProvider';

jest.mock('../components/MCPClientProvider', () => {
  const originalModule = jest.requireActual('../components/MCPClientProvider');
  return {
    ...originalModule,
    useMCPClient: jest.fn(),
  };
});

const mockedUseMCPClient = useMCPClient as jest.MockedFunction<typeof useMCPClient>;

describe('ContentList Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render loading state initially', () => {
    mockedUseMCPClient.mockReturnValue({
      loading: true,
      error: null,
      executeRequest: jest.fn(),
      clearError: jest.fn(),
    });

    render(<ContentList contentType="concepts" title="Test Concepts" />);

    expect(screen.getByText('Test Concepts')).toBeInTheDocument();
    expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
  });

  it('should render content items when loaded successfully', async () => {
    const mockItems = [
      { id: 'test-1', name: 'Test Item 1', description: 'Description 1' },
      { id: 'test-2', name: 'Test Item 2', description: 'Description 2' },
    ];

    const mockExecuteRequest = jest.fn().mockResolvedValue({
      id: 'test-id',
      result: mockItems,
      jsonrpc: '2.0'
    });

    mockedUseMCPClient.mockReturnValue({
      loading: false,
      error: null,
      executeRequest: mockExecuteRequest,
      clearError: jest.fn(),
    });

    render(<ContentList contentType="concepts" title="Test Concepts" />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    expect(mockExecuteRequest).toHaveBeenCalledWith({
      id: expect.any(String),
      method: 'listConcepts',
      params: {},
      jsonrpc: '2.0'
    });
  });

  it('should render error message when API request fails', async () => {
    const mockExecuteRequest = jest.fn().mockResolvedValue({
      id: 'test-id',
      error: {
        code: 500,
        message: 'Internal Server Error',
      },
      jsonrpc: '2.0'
    });

    mockedUseMCPClient.mockReturnValue({
      loading: false,
      error: null,
      executeRequest: mockExecuteRequest,
      clearError: jest.fn(),
    });

    render(<ContentList contentType="predicates" title="Test Predicates" />);

    await waitFor(() => {
      expect(screen.getByText('Error fetching predicates: Internal Server Error')).toBeInTheDocument();
    });
  });

  it('should render empty state when no items are returned', async () => {
    const mockExecuteRequest = jest.fn().mockResolvedValue({
      id: 'test-id',
      result: [],
      jsonrpc: '2.0'
    });

    mockedUseMCPClient.mockReturnValue({
      loading: false,
      error: null,
      executeRequest: mockExecuteRequest,
      clearError: jest.fn(),
    });

    render(<ContentList contentType="resources" title="Test Resources" />);

    await waitFor(() => {
      expect(screen.getByText('No resources found.')).toBeInTheDocument();
    });
  });
});
