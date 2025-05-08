import { mcpClient } from '../api/client';
import { createMockMCPRequest, createMockMCPResponse } from '../utils/test-utils';

global.fetch = jest.fn();

describe('MCP API Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should make a POST request to the MCP API endpoint', async () => {
    const mockRequest = createMockMCPRequest('getConceptById', { id: 'test-123' });
    const mockResponse = createMockMCPResponse(mockRequest.id, { id: 'test-123', name: 'Test Concept' });
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await mcpClient(mockRequest);

    expect(global.fetch).toHaveBeenCalledWith('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockRequest),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors correctly', async () => {
    const mockRequest = createMockMCPRequest('getConceptById', { id: 'invalid-id' });
    const mockErrorResponse = {
      id: mockRequest.id,
      error: {
        code: 404,
        message: 'Concept not found',
      },
      jsonrpc: '2.0'
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockErrorResponse)
    });

    const result = await mcpClient(mockRequest);

    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe(404);
    expect(result.error?.message).toBe('Concept not found');
  });

  it('should handle network errors', async () => {
    const mockRequest = createMockMCPRequest('getConceptById', { id: 'test-123' });
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(mcpClient(mockRequest)).rejects.toThrow('Network error');
  });
});
