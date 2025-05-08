/**
 * UOR Tools Manager
 * 
 * Manager for UOR tools in the MCP server
 */

import { UORService } from './uor-service';

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, {
      type: string;
      description?: string;
    }>;
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
 * UOR Tools Manager
 * 
 * Manager for UOR tools in the MCP server
 */
export class UORToolsManager {
  private uorService: UORService;

  /**
   * Create a new tools manager
   * 
   * @param uorService - UOR service
   */
  constructor(uorService: UORService) {
    this.uorService = uorService;
  }

  /**
   * List available tools
   * 
   * @returns List of available tools
   */
  async listTools(): Promise<Tool[]> {
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
  async callTool(name: string, args: Record<string, unknown>): Promise<UORToolResult> {
    try {
      switch (name) {
        case 'get_concept_by_id':
          return await this.getConceptById(args.id as string);
        case 'get_predicate_by_id':
          return await this.getPredicateById(args.id as string);
        case 'get_topic_by_id':
          return await this.getTopicById(args.id as string);
        case 'search_concepts':
          return await this.searchConcepts(args.query as string, args.limit as number | undefined);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error('Error calling tool:', error);
      throw new Error(`Failed to call tool: ${error instanceof Error ? error.message : String(error)}`);
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
      const concept = await this.uorService.getConceptById(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(concept, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error getting concept:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Concept with ID ${id} not found: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
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
      const predicate = await this.uorService.getPredicateById(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(predicate, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error getting predicate:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Predicate with ID ${id} not found: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
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
      const topic = await this.uorService.getTopicById(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(topic, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error getting topic:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Topic with ID ${id} not found: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
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
      const results = await this.uorService.search(query, 'concept', limit || 10);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error searching concepts:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching concepts: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
}
