import { MCPRequest, MCPResponse } from '../types/shared';

/**
 * Creates a mock MCP response for testing
 * @param id Request ID
 * @param result Response result
 * @returns MCPResponse object
 */
export function createMockMCPResponse<T>(id: string, result: T): MCPResponse<T> {
  return {
    id,
    result,
    jsonrpc: '2.0'
  };
}

/**
 * Creates a mock MCP error response for testing
 * @param id Request ID
 * @param code Error code
 * @param message Error message
 * @returns MCPResponse object with error
 */
export function createMockMCPErrorResponse(
  id: string, 
  code: number, 
  message: string
): MCPResponse<unknown> {
  return {
    id,
    error: {
      code,
      message
    },
    jsonrpc: '2.0'
  };
}

/**
 * Creates a mock MCP request for testing
 * @param method Method name
 * @param params Request parameters
 * @returns MCPRequest object
 */
export function createMockMCPRequest(
  method: string,
  params: Record<string, unknown> = {}
): MCPRequest {
  return {
    id: `test-${Date.now()}`,
    method,
    params,
    jsonrpc: '2.0'
  };
}
