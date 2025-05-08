/**
 * JSON-RPC Handler Tests
 */

import { JSONRPCHandler, JSONRPCRequest } from '../../../../src/mcp-server/utils/json-rpc-handler';

describe('JSONRPCHandler', () => {
  let handler: JSONRPCHandler;

  beforeEach(() => {
    handler = new JSONRPCHandler();
  });

  describe('registerMethod', () => {
    it('should register a method handler', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
      handler.registerMethod('test.method', mockHandler);
      
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'test.method',
        params: { key: 'value' }
      };
      
      const response = await handler.handleRequest(request);
      
      expect(mockHandler).toHaveBeenCalledWith({ key: 'value' });
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: '1',
        result: { result: 'success' }
      });
    });
  });

  describe('handleRequest', () => {
    it('should handle a request with a registered method', async () => {
      handler.registerMethod('test.method', async () => ({ result: 'success' }));
      
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'test.method'
      };
      
      const response = await handler.handleRequest(request);
      
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: '1',
        result: { result: 'success' }
      });
    });

    it('should return an error for an unregistered method', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'unknown.method'
      };
      
      const response = await handler.handleRequest(request);
      
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: '1',
        error: {
          code: -32601,
          message: 'Method not found: unknown.method'
        }
      });
    });

    it('should handle errors thrown by method handlers', async () => {
      handler.registerMethod('test.error', async () => {
        throw new Error('Test error');
      });
      
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'test.error'
      };
      
      const response = await handler.handleRequest(request);
      
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: '1',
        error: {
          code: -32603,
          message: 'Test error'
        }
      });
    });

    it('should convert primitive results to objects', async () => {
      handler.registerMethod('test.string', async () => 'string result');
      handler.registerMethod('test.number', async () => 42);
      handler.registerMethod('test.boolean', async () => true);
      handler.registerMethod('test.null', async () => null);
      
      const stringRequest: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'test.string'
      };
      
      const numberRequest: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '2',
        method: 'test.number'
      };
      
      const booleanRequest: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '3',
        method: 'test.boolean'
      };
      
      const nullRequest: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '4',
        method: 'test.null'
      };
      
      const stringResponse = await handler.handleRequest(stringRequest);
      const numberResponse = await handler.handleRequest(numberRequest);
      const booleanResponse = await handler.handleRequest(booleanRequest);
      const nullResponse = await handler.handleRequest(nullRequest);
      
      expect(stringResponse.result).toEqual({ value: 'string result' });
      expect(numberResponse.result).toEqual({ value: 42 });
      expect(booleanResponse.result).toEqual({ value: true });
      expect(nullResponse.result).toEqual({ value: null });
    });
  });
});
