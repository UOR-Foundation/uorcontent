/**
 * UOR Types
 * 
 * Type definitions for UOR Framework content
 */

/**
 * UOR Configuration
 */
export interface UORConfig {
  /**
   * Base URL for the UOR API
   * @default 'https://uor.foundation/mcp'
   */
  baseUrl?: string;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

/**
 * UOR Resource
 */
export interface UORResource {
  /**
   * Resource ID
   */
  '@id': string;

  /**
   * Resource type
   */
  '@type': string;

  /**
   * Resource name
   */
  name: string;

  /**
   * Resource description
   */
  description?: string;

  /**
   * Additional properties
   */
  [key: string]: unknown;
}

/**
 * UOR Resource Template
 */
export interface UORResourceTemplate {
  /**
   * URI template
   */
  uriTemplate: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Template description
   */
  description: string;

  /**
   * MIME type
   */
  mimeType: string;
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
   * MIME type
   */
  mimeType: string;

  /**
   * Content text
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
   * Input schema
   */
  inputSchema: {
    /**
     * Schema type
     */
    type: string;

    /**
     * Schema properties
     */
    properties: Record<string, unknown>;

    /**
     * Required properties
     */
    required?: string[];
  };
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
export interface UORConcept extends UORResource {
  /**
   * Concept type
   */
  '@type': 'DefinedTerm';
}

/**
 * UOR Predicate
 */
export interface UORPredicate extends UORResource {
  /**
   * Predicate type
   */
  '@type': 'PropertyValue';
}

/**
 * UOR Topic
 */
export interface UORTopic extends UORResource {
  /**
   * Topic type
   */
  '@type': 'CreativeWork';
}
