/**
 * MCP Schema Types
 * 
 * This file defines the TypeScript types for the MCP schema.
 * These types are used to validate requests and responses.
 */

/**
 * Base interface for all MCP requests
 */
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

/**
 * Base interface for all MCP responses
 */
export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

/**
 * MCP error object
 */
export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

/**
 * Content request parameters
 */
export interface ContentParams {
  id?: string;
  type?: string;
  page?: number;
  limit?: number;
  query?: string;
}

/**
 * Content creation parameters
 */
export interface ContentCreateParams {
  content: any;
}

/**
 * Content update parameters
 */
export interface ContentUpdateParams {
  id: string;
  content: any;
}

/**
 * Content deletion parameters
 */
export interface ContentDeleteParams {
  id: string;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  types?: string[];
  properties?: Record<string, any>;
  page?: number;
  limit?: number;
}
