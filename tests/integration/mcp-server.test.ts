/**
 * MCP Server Integration Tests
 */

import { UORMCPServer } from '../../src/mcp-server';

// Mock the MCP SDK modules
jest.mock('@modelcontextprotocol/sdk/server', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      onerror: jest.fn()
    }))
  };
});

// Mock the streamableHttp module which contains the HttpServerTransport
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp', () => {
  return {
    StreamableHTTPServerTransport: jest.fn().mockImplementation(() => ({}))
  };
});

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn().mockImplementation((url, params) => {
      return Promise.resolve({
        data: {
          itemListElement: [
            { item: { name: 'Test Item' } }
          ]
        }
      });
    }),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
  
  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance),
    post: jest.fn().mockImplementation((url, data) => {
      if (data.method === 'resources/list') {
        return Promise.resolve({
          status: 200,
          data: {
            jsonrpc: '2.0',
            id: data.id,
            result: {
              resources: [
                {
                  uri: 'uor://concept/test',
                  name: 'Test Concept',
                  mimeType: 'application/json'
                }
              ]
            }
          }
        });
      } else if (data.method === 'tools/list') {
        return Promise.resolve({
          status: 200,
          data: {
            jsonrpc: '2.0',
            id: data.id,
            result: {
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
            }
          }
        });
      }
      return Promise.reject(new Error('Unhandled request'));
    })
  };
});

describe('MCP Server Integration', () => {
  let server: UORMCPServer;
  const port = 9999;

  beforeEach(() => {
    jest.clearAllMocks();
    
    server = new UORMCPServer({
      transport: 'http',
      port
    });
  });

  it('should handle resource requests', async () => {
    // Setup the mock handler
    const mockHandler = jest.fn().mockResolvedValue({
      resources: [
        {
          uri: 'uor://concept/test',
          name: 'Test Concept',
          mimeType: 'application/json'
        }
      ]
    });
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any
    // @ts-ignore - Accessing private property for testing
    server['server'].setRequestHandler.mockImplementation((schema: any) => {
      if (schema.method === 'resources/list') {
        return mockHandler;
      }
      return undefined;
    });
    
    // Start the server
    await server.start();
    
    // Make the request
    const axios = require('axios');
    const response = await axios.post(`http://localhost:${port}`, {
      jsonrpc: '2.0',
      id: '1',
      method: 'resources/list',
      params: {}
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.result.resources).toHaveLength(1);
    expect(response.data.result.resources[0].uri).toBe('uor://concept/test');
  });

  it('should handle tool requests', async () => {
    // Setup the mock handler
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
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any
    // @ts-ignore - Accessing private property for testing
    server['server'].setRequestHandler.mockImplementation((schema: any) => {
      if (schema.method === 'tools/list') {
        return mockHandler;
      }
      return undefined;
    });
    
    // Start the server
    await server.start();
    
    // Make the request
    const axios = require('axios');
    const response = await axios.post(`http://localhost:${port}`, {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/list',
      params: {}
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.result.tools).toHaveLength(1);
    expect(response.data.result.tools[0].name).toBe('get_concept_by_id');
  });
});
