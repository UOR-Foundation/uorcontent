#!/usr/bin/env node
/**
 * UOR MCP Client
 * 
 * This is the main entry point for the UOR MCP client.
 * It implements the Model Context Protocol for the Universal Object Reference (UOR) framework.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { UORClient } from './uor-client';
import { UORConfig } from './types';

export { UORClient, UORConfig };

class UORMCPServer {
  private server: Server;
  private uorClient: UORClient;

  constructor(config: UORConfig = {}) {
    this.server = new Server(
      {
        name: 'uor-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.uorClient = new UORClient(config);

    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: unknown) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await this.uorClient.listResources();
        return { resources };
      } catch (error) {
        console.error('Error listing resources:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to list resources');
      }
    });

    // List resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      try {
        const resourceTemplates = await this.uorClient.listResourceTemplates();
        return { resourceTemplates };
      } catch (error) {
        console.error('Error listing resource templates:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to list resource templates');
      }
    });

    // Read a resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: { params: { uri: string } }) => {
      try {
        const contents = await this.uorClient.readResource(request.params.uri);
        return { contents };
      } catch (error) {
        console.error('Error reading resource:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to read resource');
      }
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = await this.uorClient.listTools();
        return { tools };
      } catch (error) {
        console.error('Error listing tools:', error);
        throw new McpError(ErrorCode.InternalError, 'Failed to list tools');
      }
    });

    // Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.uorClient.callTool(
          request.params.name, 
          request.params.arguments || {}
        );
        // Convert UORToolResult to the expected format for CallToolResultSchema
        return {
          content: result.content,
          isError: result.isError
        };
      } catch (error) {
        console.error('Error calling tool:', error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to call tool');
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('UOR MCP server running on stdio');
  }
}

// Export the server class
export { UORMCPServer };

// Run the server if this file is executed directly
if (require.main === module) {
  const server = new UORMCPServer();
  server.run().catch(console.error);
}
