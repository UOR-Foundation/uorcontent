import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { UORMCPServer, UORClient } from '../src/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      setRequestHandler: jest.fn(),
      onerror: jest.fn()
    }))
  };
});
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('@modelcontextprotocol/sdk/types.js', () => {
  return {
    ListResourcesRequestSchema: { method: 'resources/list' },
    ListResourceTemplatesRequestSchema: { method: 'resources/templates/list' },
    ReadResourceRequestSchema: { method: 'resources/read' },
    ListToolsRequestSchema: { method: 'tools/list' },
    CallToolRequestSchema: { method: 'tools/call' },
    ErrorCode: { InternalError: -32603 },
    McpError: jest.fn()
  };
});
jest.mock('../src/uor-client');

describe('UORMCPServer', () => {
  let server: UORMCPServer;
  let mockServer: jest.Mocked<Server>;
  let mockTransport: jest.Mocked<StdioServerTransport>;
  let mockUORClient: jest.Mocked<UORClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      setRequestHandler: jest.fn(),
      onerror: jest.fn()
    } as unknown as jest.Mocked<Server>;
    
    (Server as jest.Mock).mockImplementation(() => mockServer);
    
    mockTransport = {
      // Add any methods that StdioServerTransport has
    } as unknown as jest.Mocked<StdioServerTransport>;
    
    (StdioServerTransport as jest.Mock).mockImplementation(() => mockTransport);
    
    mockUORClient = {
      listResources: jest.fn(),
      listResourceTemplates: jest.fn(),
      readResource: jest.fn(),
      listTools: jest.fn(),
      callTool: jest.fn()
    } as unknown as jest.Mocked<UORClient>;
    
    (UORClient as unknown as jest.Mock).mockImplementation(() => mockUORClient);
    
    // Create server instance
    server = new UORMCPServer({
      baseUrl: 'https://test-api.example.com',
      apiKey: 'test-api-key'
    });
  });

  describe('constructor', () => {
    it('should create a Server instance', () => {
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'uor-mcp-server',
          version: '0.1.0'
        },
        {
          capabilities: {
            resources: {},
            tools: {}
          }
        }
      );
    });

    it('should create a UORClient instance with the provided config', () => {
      expect(UORClient).toHaveBeenCalledWith({
        baseUrl: 'https://test-api.example.com',
        apiKey: 'test-api-key'
      });
    });

    it('should set up request handlers', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(5);
    });

    it('should set up error handler', () => {
      expect(mockServer.onerror).toBeDefined();
    });
  });

  describe('run', () => {
    it('should connect to the transport', async () => {
      await server.run();
      
      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
    });
  });

  describe('request handlers', () => {
    it('should handle list resources request', async () => {
      // Find the list resources handler
      const listResourcesHandler = findRequestHandler(mockServer, 'ListResourcesRequest');
      expect(listResourcesHandler).toBeDefined();
      
      // Mock the UORClient response
      const mockResources = [{ uri: 'test-uri', name: 'Test Resource' }];
      mockUORClient.listResources.mockResolvedValueOnce(mockResources);
      
      // Call the handler with type assertion
      const result = await (listResourcesHandler as Function)({});
      
      expect(mockUORClient.listResources).toHaveBeenCalled();
      expect(result).toEqual({ resources: mockResources });
    });

    it('should handle errors in list resources request', async () => {
      // Find the list resources handler
      const listResourcesHandler = findRequestHandler(mockServer, 'ListResourcesRequest');
      expect(listResourcesHandler).toBeDefined();
      
      // Mock the UORClient to throw an error
      const mockError = new Error('Test error');
      mockUORClient.listResources.mockRejectedValueOnce(mockError);
      
      // Mock McpError constructor
      const MockMcpError = jest.fn();
      (MockMcpError as any).prototype = Object.create(Error.prototype);
      const originalMcpError = require('@modelcontextprotocol/sdk/types.js').McpError;
      require('@modelcontextprotocol/sdk/types.js').McpError = MockMcpError;
      
      try {
        // Call the handler with type assertion and expect it to throw
        await expect((listResourcesHandler as Function)({})).rejects.toBeTruthy();
        
        // Verify McpError was called with the right arguments
        expect(MockMcpError).toHaveBeenCalledWith(-32603, 'Failed to list resources');
      } finally {
        // Restore original McpError
        require('@modelcontextprotocol/sdk/types.js').McpError = originalMcpError;
      }
    });

    it('should handle list resource templates request', async () => {
      // Find the list resource templates handler
      const listResourceTemplatesHandler = findRequestHandler(mockServer, 'ListResourceTemplatesRequest');
      expect(listResourceTemplatesHandler).toBeDefined();
      
      // Mock the UORClient response
      const mockTemplates = [{ uriTemplate: 'test-template', name: 'Test Template' }];
      mockUORClient.listResourceTemplates.mockResolvedValueOnce(mockTemplates);
      
      // Call the handler with type assertion
      const result = await (listResourceTemplatesHandler as Function)({});
      
      expect(mockUORClient.listResourceTemplates).toHaveBeenCalled();
      expect(result).toEqual({ resourceTemplates: mockTemplates });
    });

    it('should handle errors in list resource templates request', async () => {
      // Find the list resource templates handler
      const listResourceTemplatesHandler = findRequestHandler(mockServer, 'ListResourceTemplatesRequest');
      expect(listResourceTemplatesHandler).toBeDefined();
      
      // Mock the UORClient to throw an error
      const mockError = new Error('Test error');
      mockUORClient.listResourceTemplates.mockRejectedValueOnce(mockError);
      
      // Mock McpError constructor
      const MockMcpError = jest.fn();
      (MockMcpError as any).prototype = Object.create(Error.prototype);
      const originalMcpError = require('@modelcontextprotocol/sdk/types.js').McpError;
      require('@modelcontextprotocol/sdk/types.js').McpError = MockMcpError;
      
      try {
        // Call the handler with type assertion and expect it to throw
        await expect((listResourceTemplatesHandler as Function)({})).rejects.toBeTruthy();
        
        // Verify McpError was called with the right arguments
        expect(MockMcpError).toHaveBeenCalledWith(-32603, 'Failed to list resource templates');
      } finally {
        // Restore original McpError
        require('@modelcontextprotocol/sdk/types.js').McpError = originalMcpError;
      }
    });

    it('should handle read resource request', async () => {
      // Find the read resource handler
      const readResourceHandler = findRequestHandler(mockServer, 'ReadResourceRequest');
      expect(readResourceHandler).toBeDefined();
      
      // Mock the UORClient response
      const mockContents = [{ uri: 'test-uri', mimeType: 'application/json', text: '{}' }];
      mockUORClient.readResource.mockResolvedValueOnce(mockContents);
      
      // Call the handler with type assertion
      const result = await (readResourceHandler as Function)({ params: { uri: 'test-uri' } });
      
      expect(mockUORClient.readResource).toHaveBeenCalledWith('test-uri');
      expect(result).toEqual({ contents: mockContents });
    });

    it('should handle errors in read resource request', async () => {
      // Find the read resource handler
      const readResourceHandler = findRequestHandler(mockServer, 'ReadResourceRequest');
      expect(readResourceHandler).toBeDefined();
      
      // Mock the UORClient to throw an error
      const mockError = new Error('Test error');
      mockUORClient.readResource.mockRejectedValueOnce(mockError);
      
      // Mock McpError constructor
      const MockMcpError = jest.fn();
      (MockMcpError as any).prototype = Object.create(Error.prototype);
      const originalMcpError = require('@modelcontextprotocol/sdk/types.js').McpError;
      require('@modelcontextprotocol/sdk/types.js').McpError = MockMcpError;
      
      try {
        // Call the handler with type assertion and expect it to throw
        await expect((readResourceHandler as Function)({ params: { uri: 'test-uri' } })).rejects.toBeTruthy();
        
        // Verify McpError was called with the right arguments
        expect(MockMcpError).toHaveBeenCalledWith(-32603, 'Failed to read resource');
      } finally {
        // Restore original McpError
        require('@modelcontextprotocol/sdk/types.js').McpError = originalMcpError;
      }
    });

    it('should handle list tools request', async () => {
      // Find the list tools handler
      const listToolsHandler = findRequestHandler(mockServer, 'ListToolsRequest');
      expect(listToolsHandler).toBeDefined();
      
      // Mock the UORClient response
      const mockTools = [{ name: 'test-tool', description: 'Test Tool', inputSchema: {} }];
      mockUORClient.listTools.mockResolvedValueOnce(mockTools);
      
      // Call the handler with type assertion
      const result = await (listToolsHandler as Function)({});
      
      expect(mockUORClient.listTools).toHaveBeenCalled();
      expect(result).toEqual({ tools: mockTools });
    });

    it('should handle errors in list tools request', async () => {
      // Find the list tools handler
      const listToolsHandler = findRequestHandler(mockServer, 'ListToolsRequest');
      expect(listToolsHandler).toBeDefined();
      
      // Mock the UORClient to throw an error
      const mockError = new Error('Test error');
      mockUORClient.listTools.mockRejectedValueOnce(mockError);
      
      // Mock McpError constructor
      const MockMcpError = jest.fn();
      (MockMcpError as any).prototype = Object.create(Error.prototype);
      const originalMcpError = require('@modelcontextprotocol/sdk/types.js').McpError;
      require('@modelcontextprotocol/sdk/types.js').McpError = MockMcpError;
      
      try {
        // Call the handler with type assertion and expect it to throw
        await expect((listToolsHandler as Function)({})).rejects.toBeTruthy();
        
        // Verify McpError was called with the right arguments
        expect(MockMcpError).toHaveBeenCalledWith(-32603, 'Failed to list tools');
      } finally {
        // Restore original McpError
        require('@modelcontextprotocol/sdk/types.js').McpError = originalMcpError;
      }
    });

    it('should handle call tool request', async () => {
      // Find the call tool handler
      const callToolHandler = findRequestHandler(mockServer, 'CallToolRequest');
      expect(callToolHandler).toBeDefined();
      
      // Mock the UORClient response
      const mockResult = { content: [{ type: 'text', text: 'Test result' }] };
      mockUORClient.callTool.mockResolvedValueOnce(mockResult);
      
      // Call the handler with type assertion
      const result = await (callToolHandler as Function)({ params: { name: 'test-tool', arguments: { arg: 'value' } } });
      
      expect(mockUORClient.callTool).toHaveBeenCalledWith('test-tool', { arg: 'value' });
      expect(result).toEqual(mockResult);
    });

    it('should handle errors in call tool request', async () => {
      // Find the call tool handler
      const callToolHandler = findRequestHandler(mockServer, 'CallToolRequest');
      expect(callToolHandler).toBeDefined();
      
      // Mock the UORClient to throw an error
      const mockError = new Error('Test error');
      mockUORClient.callTool.mockRejectedValueOnce(mockError);
      
      // Mock McpError constructor
      const MockMcpError = jest.fn();
      (MockMcpError as any).prototype = Object.create(Error.prototype);
      const originalMcpError = require('@modelcontextprotocol/sdk/types.js').McpError;
      require('@modelcontextprotocol/sdk/types.js').McpError = MockMcpError;
      
      try {
        // Call the handler with type assertion and expect it to throw
        await expect((callToolHandler as Function)({ params: { name: 'test-tool', arguments: { arg: 'value' } } })).rejects.toBeTruthy();
        
        // Verify McpError was called with the right arguments
        expect(MockMcpError).toHaveBeenCalledWith(-32603, 'Failed to call tool');
      } finally {
        // Restore original McpError
        require('@modelcontextprotocol/sdk/types.js').McpError = originalMcpError;
      }
    });

    it('should pass through McpError in call tool request', async () => {
      // Find the call tool handler
      const callToolHandler = findRequestHandler(mockServer, 'CallToolRequest');
      expect(callToolHandler).toBeDefined();
      
      // Create a McpError
      const McpError = require('@modelcontextprotocol/sdk/types.js').McpError;
      const mockError = new McpError(-32601, 'Method not found');
      
      // Mock the UORClient to throw the McpError
      mockUORClient.callTool.mockRejectedValueOnce(mockError);
      
      // Call the handler with type assertion and expect it to throw the same error
      await expect((callToolHandler as Function)({ params: { name: 'test-tool', arguments: { arg: 'value' } } }))
        .rejects.toBe(mockError);
    });
  });
});

// Helper function to find a request handler by schema name
function findRequestHandler(mockServer: jest.Mocked<Server>, schemaName: string): Function | undefined {
  // Map schema names to method names
  const methodMap: Record<string, string> = {
    'ListResourcesRequest': 'resources/list',
    'ListResourceTemplatesRequest': 'resources/templates/list',
    'ReadResourceRequest': 'resources/read',
    'ListToolsRequest': 'tools/list',
    'CallToolRequest': 'tools/call'
  };
  
  // Find the call to setRequestHandler with the matching schema name
  const call = mockServer.setRequestHandler.mock.calls.find(call => {
    // For mocked objects, we need to check if the schema object contains the method property
    return call[0] && typeof call[0] === 'object' && 'method' in call[0] && 
      call[0].method === methodMap[schemaName];
  });
  
  return call ? call[1] : undefined;
}
