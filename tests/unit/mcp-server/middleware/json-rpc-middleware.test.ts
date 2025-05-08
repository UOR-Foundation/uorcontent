/**
 * JSON-RPC Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { createJSONRPCMiddleware } from '../../../../src/mcp-server/middleware/json-rpc-middleware';
import { JSONRPCHandler } from '../../../../src/mcp-server/utils/json-rpc-handler';

describe('JSON-RPC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockHandler: JSONRPCHandler;
  let middleware: ReturnType<typeof createJSONRPCMiddleware>;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      body: {
        jsonrpc: '2.0',
        id: '1',
        method: 'test.method',
        params: { key: 'value' }
      }
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    mockHandler = new JSONRPCHandler();
    jest.spyOn(mockHandler, 'handleRequest').mockResolvedValue({
      jsonrpc: '2.0',
      id: '1',
      result: { success: true }
    });
    
    middleware = createJSONRPCMiddleware(mockHandler);
  });

  it('should pass non-POST requests to next middleware', async () => {
    mockRequest.method = 'GET';
    
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockHandler.handleRequest).not.toHaveBeenCalled();
  });

  it('should handle valid JSON-RPC requests', async () => {
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockHandler.handleRequest).toHaveBeenCalledWith(mockRequest.body);
    expect(mockResponse.json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      id: '1',
      result: { success: true }
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle errors and pass them to next middleware', async () => {
    const error = new Error('Test error');
    mockHandler.handleRequest = jest.fn().mockRejectedValue(error);
    
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
