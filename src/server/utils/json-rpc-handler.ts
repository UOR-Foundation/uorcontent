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
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC response interface
 */
export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: Record<string, unknown>;
  error?: JSONRPCError;
}

/**
 * JSON-RPC error interface
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * JSON-RPC method handler type
 * 
 * Generic type that allows for different return types
 * while ensuring they can be converted to JSON-RPC responses
 */
export type MethodHandler = (params: Record<string, unknown>) => Promise<unknown>;

/**
 * Helper function to convert any result to a Record<string, unknown>
 * 
 * @param result - Result from method handler
 * @returns Result as Record<string, unknown>
 */
function ensureRecord(result: unknown): Record<string, unknown> {
  if (result === null || result === undefined) {
    return { value: null };
  }
  
  if (typeof result === 'object' && result !== null) {
    return result as Record<string, unknown>;
  }
  
  if (typeof result === 'boolean' || typeof result === 'number' || typeof result === 'string') {
    return { value: result };
  }
  
  return { value: String(result) };
}

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
      
      const handlerResult = await handler(request.params || {});
      const result = ensureRecord(handlerResult);
      
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
    data?: Record<string, unknown>
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
