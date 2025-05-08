import { JSONRPCHandler, JSONRPCRequest } from '../../../src/server/utils/json-rpc-handler';

describe('JSONRPCHandler', () => {
  let handler: JSONRPCHandler;

  beforeEach(() => {
    handler = new JSONRPCHandler();
  });

  test('should register and handle methods', async () => {
    handler.registerMethod('test.method', async (params) => {
      return { result: params.value * 2 };
    });

    const request = {
      jsonrpc: '2.0' as const,
      id: '1',
      method: 'test.method',
      params: { value: 5 }
    } as JSONRPCRequest;

    const response = await handler.handleRequest(request);

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '1',
      result: { result: 10 }
    });
  });

  test('should return error for unknown method', async () => {
    const request = {
      jsonrpc: '2.0' as const,
      id: '1',
      method: 'unknown.method',
      params: {}
    } as JSONRPCRequest;

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

  test('should handle errors in method handlers', async () => {
    handler.registerMethod('test.error', async () => {
      throw new Error('Test error');
    });

    const request = {
      jsonrpc: '2.0' as const,
      id: '1',
      method: 'test.error',
      params: {}
    } as JSONRPCRequest;

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
});
