import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ContentList from '../components/ContentList';
import { mcpClient } from '../api/client';
import { createMockMCPResponse } from '../utils/test-utils';

jest.mock('../api/client');
const mockedMcpClient = mcpClient as jest.MockedFunction<typeof mcpClient>;

describe('ContentList Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render loading state initially', () => {
    mockedMcpClient.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ContentList contentType="concepts" title="Test Concepts" />);

    expect(screen.getByText('Test Concepts')).toBeInTheDocument();
    expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
  });

  it('should render content items when loaded successfully', async () => {
    const mockItems = [
      { id: 'test-1', name: 'Test Item 1', description: 'Description 1' },
      { id: 'test-2', name: 'Test Item 2', description: 'Description 2' },
    ];

    mockedMcpClient.mockResolvedValueOnce(
      createMockMCPResponse('test-id', mockItems)
    );

    render(<ContentList contentType="concepts" title="Test Concepts" />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    expect(mockedMcpClient).toHaveBeenCalledWith({
      id: expect.any(String),
      method: 'listConcepts',
      params: {},
      jsonrpc: '2.0'
    });
  });

  it('should render error message when API request fails', async () => {
    mockedMcpClient.mockResolvedValueOnce({
      id: 'test-id',
      error: {
        code: 500,
        message: 'Internal Server Error',
      },
      jsonrpc: '2.0'
    });

    render(<ContentList contentType="predicates" title="Test Predicates" />);

    await waitFor(() => {
      expect(screen.getByText('Error fetching predicates: Internal Server Error')).toBeInTheDocument();
    });
  });

  it('should render empty state when no items are returned', async () => {
    mockedMcpClient.mockResolvedValueOnce(
      createMockMCPResponse('test-id', [])
    );

    render(<ContentList contentType="resources" title="Test Resources" />);

    await waitFor(() => {
      expect(screen.getByText('No resources found.')).toBeInTheDocument();
    });
  });
});
