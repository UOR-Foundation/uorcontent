/**
 * UOR MCP Server
 * 
 * Main entry point for the MCP server that provides a standardized API
 * for AI assistants to access UOR Framework content through the Model Context Protocol.
 */

import { UORService } from './services/uor-service';
import { UORResourceManager } from './services/resource-manager';
import { UORToolsManager } from './services/tools-manager';
import { MCPValidationService } from './services/validation-service';
import { logger } from '../mcp-server/utils/logger';

import * as mcpServer from '@modelcontextprotocol/sdk/server';
import * as mcpStdio from '@modelcontextprotocol/sdk/server/stdio';
import * as mcpHttp from '@modelcontextprotocol/sdk/server/streamableHttp';

const Server = mcpServer.Server;
const StdioServerTransport = mcpStdio.StdioServerTransport;
const StreamableHTTPServerTransport = mcpHttp.StreamableHTTPServerTransport;

const ListResourcesRequestSchema = { method: 'resources/list' };
const ListResourceTemplatesRequestSchema = { method: 'resources/listTemplates' };
const ReadResourceRequestSchema = { method: 'resources/read' };
const ListToolsRequestSchema = { method: 'tools/list' };
const CallToolRequestSchema = { method: 'tools/call' };

enum ErrorCode {
  InternalError = 'internal_error',
  InvalidParams = 'invalid_params',
  NotFound = 'not_found'
}

class McpError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'McpError';
  }
}

/**
 * UOR MCP Server Configuration
 */
export interface UORMCPServerConfig {
  /**
   * Server name
   * @default 'uor-mcp-server'
   */
  name?: string;

  /**
   * Server version
   * @default '0.1.0'
   */
  version?: string;

  /**
   * Base URL for the UOR API
   * @default 'http://localhost:3000/api'
   */
  apiUrl?: string;

  /**
   * Port for HTTP transport (if used)
   * @default 9000
   */
  port?: number;

  /**
   * Transport type
   * @default 'stdio'
   */
  transport?: 'stdio' | 'http';
}

/**
 * UOR MCP Server
 * 
 * Implements the Model Context Protocol for the Universal Object Reference (UOR) framework.
 * This server provides access to UOR content through the MCP protocol, allowing AI assistants
 * to interact with UOR concepts, predicates, topics, and resources.
 */
export class UORMCPServer {
  private server: InstanceType<typeof Server>;
  private uorService: UORService;
  private resourceManager: UORResourceManager;
  private toolsManager: UORToolsManager;
  private validationService: MCPValidationService;


  /**
   * Create a new UOR MCP server
   * 
   * @param config - Server configuration
   */
  constructor(config: UORMCPServerConfig = {}) {
    this.server = new Server(
      {
        name: config.name || 'uor-mcp-server',
        version: config.version || '0.1.0',
      },
      {
        capabilities: {
          resources: {
            read: true,
            subscribe: true,
          },
          tools: {},
        },
      }
    );

    this.uorService = new UORService(config.apiUrl || 'http://localhost:3000/api');
    this.resourceManager = new UORResourceManager(this.uorService);
    this.toolsManager = new UORToolsManager(this.uorService);
    this.validationService = new MCPValidationService();

    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    this.server.onerror = (error: unknown) => logger.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });
  }

  /**
   * Set up resource handlers
   */
  private setupResourceHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async (): Promise<{ resources: unknown[] }> => {
      try {
        const resources = await this.resourceManager.listResources();
        return { resources };
      } catch (error) {
        logger.error('Error listing resources:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to list resources');
      }
    });

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async (): Promise<{ resourceTemplates: unknown[] }> => {
      try {
        const resourceTemplates = await this.resourceManager.listResourceTemplates();
        return { resourceTemplates };
      } catch (error) {
        logger.error('Error listing resource templates:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to list resource templates');
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: unknown): Promise<{ contents: unknown[] }> => {
      try {
        const typedRequest = request as { params: { uri: string } };
        const uri = typedRequest.params.uri;
        const valid = this.validationService.validateResourceUri(uri);
        
        if (!valid) {
          throw new McpError(ErrorCode.InvalidParams, `Invalid resource URI: ${uri}`);
        }
        
        const contents = await this.resourceManager.readResource(uri);
        return { contents };
      } catch (error) {
        logger.error('Error reading resource:', error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to read resource');
      }
    });
  }

  /**
   * Set up tool handlers
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async (): Promise<{ tools: unknown[] }> => {
      try {
        const tools = await this.toolsManager.listTools();
        return { tools };
      } catch (error) {
        logger.error('Error listing tools:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to list tools');
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: unknown): Promise<{ 
      content: Array<{ type: string; text: string }>; 
      isError?: boolean 
    }> => {
      try {
        const typedRequest = request as { 
          params: { 
            name: string; 
            arguments?: Record<string, unknown> 
          } 
        };
        
        const result = await this.toolsManager.callTool(
          typedRequest.params.name, 
          typedRequest.params.arguments || {}
        );
        
        return {
          content: result.content,
          isError: result.isError
        };
      } catch (error) {
        logger.error('Error calling tool:', error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to call tool');
      }
    });
  }





  /**
   * Start the server
   * 
   * @param config - Server configuration
   * @returns A promise that resolves when the server is started
   */
  async start(config: UORMCPServerConfig = {}): Promise<void> {
    try {
      const transport = config.transport || 'stdio';
      
      if (transport === 'stdio') {
        const stdioTransport = new StdioServerTransport();
        await this.server.connect(stdioTransport);
        logger.info('UOR MCP server running on stdio');
      } else if (transport === 'http') {
        const port = config.port || 9000;
        const httpTransport = new StreamableHTTPServerTransport({ port });
        await this.server.connect(httpTransport);
        logger.info(`UOR MCP server running on http://localhost:${port}`);
      } else {
        throw new Error(`Unsupported transport type: ${transport}`);
      }
    } catch (error) {
      logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Close the server
   * 
   * @returns A promise that resolves when the server is closed
   */
  async close(): Promise<void> {
    try {
      await this.server.close();
    } catch (error) {
      logger.error('Error closing server:', error);
      throw error;
    }
  }
}

/**
 * If this file is executed directly, start the server
 */
if (typeof require !== 'undefined' && require.main === module) {
  const server = new UORMCPServer();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
