/**
 * MCP Server Integration Tests
 */

import { UORMCPServer } from '../../src/mcp-server';
import axios from 'axios';

type Server = {
  setRequestHandler: jest.Mock;
  connect: jest.Mock;
  close: jest.Mock;
  onerror: jest.Mock;
};

jest.mock('@modelcontextprotocol/sdk/server', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    onerror: jest.fn()
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/http', () => ({
  HttpServerTransport: jest.fn().mockImplementation(() => ({}))
}));

describe('MCP Server Integration', () => {
  let server: UORMCPServer;
  const port = 9999;

  beforeAll(async () => {
    server = new UORMCPServer({
      transport: 'http',
      port
    });
    
    await server.start();
  });

  afterAll(async () => {
    await server['server'].close();
  });

  it('should handle resource requests', async () => {
    const mockHandler = jest.fn().mockResolvedValue({
      resources: [
        {
          uri: 'uor://concept/test',
          name: 'Test Concept',
          mimeType: 'application/json'
        }
      ]
    });
    
    server['server'].setRequestHandler.mockImplementation((schema, handler) => {
      if (schema.method === 'resources/list') {
        return mockHandler;
      }
    });
    
    const response = await axios.post(`http://localhost:${port}`, {
      jsonrpc: '2.0',
      id: '1',
      method: 'resources/list',
      params: {}
    });
    
    expect(response.status).toBe(200);
    expect((response.data as any).result.resources).toHaveLength(1);
    expect((response.data as any).result.resources[0].uri).toBe('uor://concept/test');
  });

  it('should handle tool requests', async () => {
    const mockHandler = jest.fn().mockResolvedValue({
      tools: [
        {
          name: 'get_concept_by_id',
          description: 'Get a concept by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Concept ID'
              }
            },
            required: ['id']
          }
        }
      ]
    });
    
    server['server'].setRequestHandler.mockImplementation((schema, handler) => {
      if (schema.method === 'tools/list') {
        return mockHandler;
      }
    });
    
    const response = await axios.post(`http://localhost:${port}`, {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/list',
      params: {}
    });
    
    expect(response.status).toBe(200);
    expect((response.data as any).result.tools).toHaveLength(1);
    expect((response.data as any).result.tools[0].name).toBe('get_concept_by_id');
  });
});
