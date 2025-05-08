/**
 * MCP Validation Service
 * 
 * Service for validating MCP requests and responses
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ErrorObject[];
}

/**
 * MCP Validation Service
 * 
 * Service for validating MCP requests and responses
 */
export class MCPValidationService {
  private ajv: Ajv;

  /**
   * Create a new validation service
   */
  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      strict: false
    });
    addFormats(this.ajv);
  }

  /**
   * Validate a resource URI
   * 
   * @param uri - Resource URI
   * @returns Whether the URI is valid
   */
  validateResourceUri(uri: string): boolean {
    const uriPattern = /^uor:\/\/(concept|predicate|topic|resource)\/[a-zA-Z0-9-_]+$/;
    return uriPattern.test(uri);
  }

  /**
   * Validate a tool name
   * 
   * @param name - Tool name
   * @returns Whether the name is valid
   */
  validateToolName(name: string): boolean {
    const validTools = [
      'get_concept_by_id',
      'get_predicate_by_id',
      'get_topic_by_id',
      'search_concepts'
    ];
    return validTools.includes(name);
  }

  /**
   * Validate tool arguments
   * 
   * @param name - Tool name
   * @param args - Tool arguments
   * @returns Validation result
   */
  validateToolArguments(name: string, args: Record<string, any>): ValidationResult {
    let schema: Record<string, any>;
    
    switch (name) {
      case 'get_concept_by_id':
      case 'get_predicate_by_id':
      case 'get_topic_by_id':
        schema = {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id'],
          additionalProperties: false
        };
        break;
      case 'search_concepts':
        schema = {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', minimum: 1 }
          },
          required: ['query'],
          additionalProperties: false
        };
        break;
      default:
        return { valid: false, errors: [{ keyword: 'enum', message: `Unknown tool: ${name}` } as ErrorObject] };
    }
    
    const validate = this.ajv.compile(schema);
    const valid = validate(args);
    
    return {
      valid,
      errors: valid ? undefined : (validate.errors || [])
    };
  }
}
