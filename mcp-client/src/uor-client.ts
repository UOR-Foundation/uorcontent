/**
 * UOR Client
 * 
 * This file implements the client for interacting with the UOR API.
 */

import axios, { AxiosInstance } from 'axios';
import { 
  UORConfig, 
  UORResource, 
  UORResourceTemplate, 
  UORResourceContent, 
  UORTool, 
  UORToolResult,
  UORConcept,
  UORPredicate,
  UORTopic
} from './types';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

/**
 * UOR Client
 * 
 * Client for interacting with the UOR API
 */
export class UORClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;

  /**
   * Create a new UOR client
   * 
   * @param config - Client configuration
   */
  constructor(config: UORConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://uor.foundation/mcp';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
      }
    });
  }

  /**
   * List available resources
   * 
   * @returns List of available resources
   */
  async listResources(): Promise<UORResource[]> {
    try {
      const response = await this.axiosInstance.get('/api/resources');
      
      if (response.data && response.data.itemListElement) {
        return response.data.itemListElement.map((item: any) => ({
          uri: `uor://resource/${item.item['@id'].split(':').pop()}`,
          name: item.item.name,
          description: item.item.description,
          mimeType: 'application/json'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error listing resources:', error);
      throw new McpError(ErrorCode.InternalError, 'Failed to list resources');
    }
  }

  /**
   * List resource templates
   * 
   * @returns List of resource templates
   */
  async listResourceTemplates(): Promise<UORResourceTemplate[]> {
    return [
      {
        uriTemplate: 'uor://concept/{id}',
        name: 'UOR Concept',
        description: 'A concept in the Universal Object Reference framework',
        mimeType: 'application/json'
      },
      {
        uriTemplate: 'uor://predicate/{id}',
        name: 'UOR Predicate',
        description: 'A predicate in the Universal Object Reference framework',
        mimeType: 'application/json'
      },
      {
        uriTemplate: 'uor://topic/{id}',
        name: 'UOR Topic',
        description: 'A topic in the Universal Object Reference framework',
        mimeType: 'application/json'
      },
      {
        uriTemplate: 'uor://resource/{id}',
        name: 'UOR Resource',
        description: 'A resource in the Universal Object Reference framework',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Read a resource
   * 
   * @param uri - Resource URI
   * @returns Resource content
   */
  async readResource(uri: string): Promise<UORResourceContent[]> {
    try {
      // Parse the URI to determine the resource type and ID
      const match = uri.match(/^uor:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        // For the test case, we need to throw with this specific message
        throw new McpError(ErrorCode.InvalidParams, `Invalid URI format: ${uri}`);
      }

      const [, type, id] = match;
      let endpoint: string;

      switch (type) {
        case 'concept':
          endpoint = `/api/concepts/urn:uor:concept:${id}`;
          break;
        case 'predicate':
          endpoint = `/api/predicates/urn:uor:predicate:${id}`;
          break;
        case 'topic':
          endpoint = `/api/topics/urn:uor:topic:${id}`;
          break;
        case 'resource':
          endpoint = `/api/resources/urn:uor:resource:${id}`;
          break;
        default:
          // For the test case, we need to throw with this specific message
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource type: ${type}`);
      }

      const response = await this.axiosInstance.get(endpoint);
      
      return [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(response.data, null, 2)
      }];
    } catch (error) {
      console.error('Error reading resource:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new McpError(ErrorCode.MethodNotFound, `Resource not found: ${uri}`);
      }
      
      // Re-throw the original error if it's already a McpError
      if (error instanceof McpError) {
        throw error;
      }
      
      throw new McpError(ErrorCode.InternalError, 'Failed to read resource');
    }
  }

  /**
   * List available tools
   * 
   * @returns List of available tools
   */
  async listTools(): Promise<UORTool[]> {
    return [
      {
        name: 'get_concept_by_id',
        description: 'Get a concept by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Concept ID (e.g., "urn:uor:concept:uor-framework")'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'get_predicate_by_id',
        description: 'Get a predicate by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Predicate ID (e.g., "urn:uor:predicate:overview-introduces-uor")'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'get_topic_by_id',
        description: 'Get a topic by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Topic ID (e.g., "urn:uor:topic:universal-object-reference")'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'search_concepts',
        description: 'Search for concepts',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return'
            }
          },
          required: ['query']
        }
      }
    ];
  }

  /**
   * Call a tool
   * 
   * @param name - Tool name
   * @param args - Tool arguments
   * @returns Tool result
   */
  async callTool(name: string, args: Record<string, any>): Promise<UORToolResult> {
    try {
      switch (name) {
        case 'get_concept_by_id':
          return await this.getConceptById(args.id);
        case 'get_predicate_by_id':
          return await this.getPredicateById(args.id);
        case 'get_topic_by_id':
          return await this.getTopicById(args.id);
        case 'search_concepts':
          return await this.searchConcepts(args.query, args.limit);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error('Error calling tool:', error);
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, 'Failed to call tool');
    }
  }

  /**
   * Get a concept by ID
   * 
   * @param id - Concept ID
   * @returns Concept data
   */
  private async getConceptById(id: string): Promise<UORToolResult> {
    try {
      const response = await this.axiosInstance.get(`/api/concepts/${id}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error getting concept:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `Concept with ID ${id} not found`
            }
          ],
          isError: true
        };
      }
      throw new McpError(ErrorCode.InternalError, 'Failed to get concept');
    }
  }

  /**
   * Get a predicate by ID
   * 
   * @param id - Predicate ID
   * @returns Predicate data
   */
  private async getPredicateById(id: string): Promise<UORToolResult> {
    try {
      const response = await this.axiosInstance.get(`/api/predicates/${id}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error getting predicate:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `Predicate with ID ${id} not found`
            }
          ],
          isError: true
        };
      }
      throw new McpError(ErrorCode.InternalError, 'Failed to get predicate');
    }
  }

  /**
   * Get a topic by ID
   * 
   * @param id - Topic ID
   * @returns Topic data
   */
  private async getTopicById(id: string): Promise<UORToolResult> {
    try {
      const response = await this.axiosInstance.get(`/api/topics/${id}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error getting topic:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `Topic with ID ${id} not found`
            }
          ],
          isError: true
        };
      }
      throw new McpError(ErrorCode.InternalError, 'Failed to get topic');
    }
  }

  /**
   * Search for concepts
   * 
   * @param query - Search query
   * @param limit - Maximum number of results to return
   * @returns Search results
   */
  private async searchConcepts(query: string, limit?: number): Promise<UORToolResult> {
    try {
      const response = await this.axiosInstance.get('/api/search', {
        params: {
          q: query,
          type: 'concept',
          limit: limit || 10
        }
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error searching concepts:', error);
      throw new McpError(ErrorCode.InternalError, 'Failed to search concepts');
    }
  }
}
