import request from 'supertest';
import { MCPServer } from '../../src/server';

describe('MCP Server', () => {
  let server: MCPServer;
  let app: any;

  beforeAll(() => {
    server = new MCPServer(3000);
    app = server.getApp();
  });

  test('should handle JSON-RPC content.list request', async () => {
    const response = await request(app)
      .post('/api/jsonrpc')
      .send({
        jsonrpc: '2.0',
        id: '1',
        method: 'content.list',
        params: { page: 1, limit: 10 }
      });

    expect(response.status).toBe(200);
    expect(response.body.jsonrpc).toBe('2.0');
    expect(response.body.id).toBe('1');
    expect(response.body.result).toBeDefined();
  });

  test('should handle JSON-RPC method not found', async () => {
    const response = await request(app)
      .post('/api/jsonrpc')
      .send({
        jsonrpc: '2.0',
        id: '1',
        method: 'unknown.method',
        params: {}
      });

    expect(response.status).toBe(200);
    expect(response.body.jsonrpc).toBe('2.0');
    expect(response.body.id).toBe('1');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe(-32601);
  });

  test('should validate JSON-RPC request format', async () => {
    const response = await request(app)
      .post('/api/jsonrpc')
      .send({
        id: '1',
        method: 'content.list',
        params: {}
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
