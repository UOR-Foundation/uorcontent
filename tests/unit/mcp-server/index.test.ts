/**
 * UOR MCP Server Tests
 */

import { UORMCPServer } from '../../../src/mcp-server';
import { UORService } from '../../../src/mcp-server/services/uor-service';
import { UORResourceManager } from '../../../src/mcp-server/services/resource-manager';
import { UORToolsManager } from '../../../src/mcp-server/services/tools-manager';
import { MCPValidationService } from '../../../src/mcp-server/services/validation-service';

jest.mock('../../../src/mcp-server/services/uor-service');
jest.mock('../../../src/mcp-server/services/resource-manager');
jest.mock('../../../src/mcp-server/services/tools-manager');
jest.mock('../../../src/mcp-server/services/validation-service');
jest.mock('@modelcontextprotocol/sdk/server');
jest.mock('@modelcontextprotocol/sdk/server/stdio');
jest.mock('@modelcontextprotocol/sdk/server/http');

describe('UORMCPServer', () => {
  let server: UORMCPServer;

  beforeEach(() => {
    jest.clearAllMocks();
    
    server = new UORMCPServer();
  });

  describe('constructor', () => {
    it('should create a new server instance with default config', () => {
      expect(server).toBeDefined();
    });

    it('should create a new server instance with custom config', () => {
      const customServer = new UORMCPServer({
        name: 'custom-server',
        version: '1.0.0',
        apiUrl: 'http://example.com/api',
        port: 8000,
        transport: 'http'
      });
      
      expect(customServer).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start the server with stdio transport by default', async () => {
      await expect(server.start()).resolves.not.toThrow();
    });

    it('should start the server with http transport when specified', async () => {
      await expect(server.start({ transport: 'http', port: 8000 })).resolves.not.toThrow();
    });

    it('should throw an error for unsupported transport', async () => {
      await expect(server.start({ transport: 'invalid' as 'stdio' | 'http' })).rejects.toThrow('Unsupported transport type: invalid');
    });
  });
});
