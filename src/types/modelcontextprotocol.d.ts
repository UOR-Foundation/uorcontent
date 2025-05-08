/**
 * Type declarations for the Model Context Protocol SDK
 */

declare module '@modelcontextprotocol/sdk/server' {
  export class Server {
    constructor(
      info: { name: string; version: string },
      capabilities: {
        capabilities: {
          resources: {
            read: boolean;
            subscribe: boolean;
          };
          tools: Record<string, unknown>;
        };
      }
    );
    
    setRequestHandler(
      schema: { method: string },
      handler: (request: unknown) => Promise<unknown>
    ): void;
    
    connect(transport: unknown): Promise<void>;
    close(): Promise<void>;
    onerror: (error: unknown) => void;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio' {
  export class StdioServerTransport {
    constructor();
  }
}

declare module '@modelcontextprotocol/sdk/server/streamableHttp' {
  export class StreamableHTTPServerTransport {
    constructor(options: { port: number });
  }
}

declare module '@modelcontextprotocol/sdk/types' {
  export interface Resource {
    uri: string;
    name: string;
    description?: string;
    mimeType: string;
  }

  export interface ResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType: string;
  }

  export interface Tool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }

  export enum ErrorCode {
    InternalError = 'internal_error',
    InvalidParams = 'invalid_params',
    NotFound = 'not_found'
  }

  export class McpError extends Error {
    constructor(code: ErrorCode, message: string);
    code: ErrorCode;
  }

  export const ListResourcesRequestSchema: { method: string };
  export const ListResourceTemplatesRequestSchema: { method: string };
  export const ReadResourceRequestSchema: { method: string };
  export const ListToolsRequestSchema: { method: string };
  export const CallToolRequestSchema: { method: string };
}
