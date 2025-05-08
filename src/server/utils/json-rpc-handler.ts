/**
 * JSON-RPC Handler
 * 
 * This utility handles JSON-RPC 2.0 requests and responses
 * as defined by the Model Context Protocol specification.
 */

/**
 * JSON-RPC request interface
 */
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

/**
 * JSON-RPC response interface
 */
export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: JSONRPCError;
}

/**
 * JSON-RPC error interface
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

/**
 * JSON-RPC method handler type
 */
export type MethodHandler = (params: any) => Promise<any>;

/**
 * JSON-RPC Handler
 * 
 * Handles JSON-RPC 2.0 requests and responses
 */
export class JSONRPCHandler {
  private methods: Map<string, MethodHandler>;

  /**
   * Create a new JSON-RPC handler
   */
  constructor() {
    this.methods = new Map();
  }

  /**
   * Register a method handler
   * 
   * @param method - Method name
   * @param handler - Method handler function
   */
  public registerMethod(method: string, handler: MethodHandler): void {
    this.methods.set(method, handler);
  }

  /**
   * Handle a JSON-RPC request
   * 
   * @param request - JSON-RPC request
   * @returns JSON-RPC response
   */
  public async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    try {
      const handler = this.methods.get(request.method);
      
      if (!handler) {
        return this.createErrorResponse(
          request.id,
          -32601,
          `Method not found: ${request.method}`
        );
      }
      
      const result = await handler(request.params || {});
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      return this.createErrorResponse(
        request.id,
        -32603,
        message
      );
    }
  }

  /**
   * Create an error response
   * 
   * @param id - Request ID
   * @param code - Error code
   * @param message - Error message
   * @param data - Additional error data
   * @returns JSON-RPC error response
   */
  private createErrorResponse(
    id: string | number,
    code: number,
    message: string,
    data?: any
  ): JSONRPCResponse {
    const error: JSONRPCError = {
      code,
      message,
      data
    };
    
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }
}
