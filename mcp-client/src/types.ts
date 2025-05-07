/**
 * UOR MCP Client Types
 * 
 * This file defines the types used by the UOR MCP client.
 */

/**
 * UOR Client Configuration
 */
export interface UORConfig {
  /**
   * Base URL for the UOR API
   * @default 'https://uor.foundation/mcp'
   */
  baseUrl?: string;

  /**
   * API key for authentication (if required)
   */
  apiKey?: string;

  /**
   * Timeout for API requests in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;
}

/**
 * UOR Resource
 */
export interface UORResource {
  /**
   * Resource URI
   */
  uri: string;

  /**
   * Resource name
   */
  name: string;

  /**
   * Resource MIME type
   */
  mimeType?: string;

  /**
   * Resource description
   */
  description?: string;
}

/**
 * UOR Resource Template
 */
export interface UORResourceTemplate {
  /**
   * Resource template URI
   */
  uriTemplate: string;

  /**
   * Resource template name
   */
  name: string;

  /**
   * Resource template MIME type
   */
  mimeType?: string;

  /**
   * Resource template description
   */
  description?: string;
}

/**
 * UOR Resource Content
 */
export interface UORResourceContent {
  /**
   * Resource URI
   */
  uri: string;

  /**
   * Resource MIME type
   */
  mimeType: string;

  /**
   * Resource text content
   */
  text: string;
}

/**
 * UOR Tool
 */
export interface UORTool {
  /**
   * Tool name
   */
  name: string;

  /**
   * Tool description
   */
  description: string;

  /**
   * Tool input schema
   */
  inputSchema: Record<string, any>;
}

/**
 * UOR Tool Result
 */
export interface UORToolResult {
  /**
   * Tool result content
   */
  content: Array<{
    /**
     * Content type
     */
    type: string;

    /**
     * Content text
     */
    text: string;
  }>;

  /**
   * Whether the tool execution resulted in an error
   */
  isError?: boolean;
}

/**
 * UOR Concept
 */
export interface UORConcept {
  /**
   * Concept ID
   */
  '@id': string;

  /**
   * Concept type
   */
  '@type': string;

  /**
   * Concept name
   */
  name: string;

  /**
   * Concept description
   */
  description?: string;

  /**
   * Additional properties
   */
  [key: string]: any;
}

/**
 * UOR Predicate
 */
export interface UORPredicate {
  /**
   * Predicate ID
   */
  '@id': string;

  /**
   * Predicate type
   */
  '@type': string;

  /**
   * Predicate name
   */
  name: string;

  /**
   * Predicate description
   */
  description?: string;

  /**
   * Additional properties
   */
  [key: string]: any;
}

/**
 * UOR Topic
 */
export interface UORTopic {
  /**
   * Topic ID
   */
  '@id': string;

  /**
   * Topic type
   */
  '@type': string;

  /**
   * Topic name
   */
  name: string;

  /**
   * Topic description
   */
  description?: string;

  /**
   * Additional properties
   */
  [key: string]: any;
}
