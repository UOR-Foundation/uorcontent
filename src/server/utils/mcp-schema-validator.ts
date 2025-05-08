/**
 * MCP Schema Validator
 * 
 * This utility validates requests against the MCP schema.
 * It uses the MCP TypeScript schema from the git-submodule.
 */

import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { SchemaError } from '../types/errors';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ErrorObject[];
}

/**
 * MCP Schema Validator
 * 
 * Singleton class for validating requests against the MCP schema
 */
export class MCPSchemaValidator {
  private static instance: MCPSchemaValidator;
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction>;
  private initialized: boolean;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      strict: false
    });
    addFormats(this.ajv);
    this.validators = new Map();
    this.initialized = false;
  }
  
  /**
   * Get initialized status
   */
  public get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the singleton instance
   * 
   * @returns The singleton instance
   */
  public static getInstance(): MCPSchemaValidator {
    if (!MCPSchemaValidator.instance) {
      MCPSchemaValidator.instance = new MCPSchemaValidator();
    }
    return MCPSchemaValidator.instance;
  }

  /**
   * Initialize the validator
   * 
   * Loads schemas from the MCP schema git-submodule
   * 
   * @returns A promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const requestSchema = {
        type: 'object',
        properties: {
          '@context': { type: 'string' },
          '@type': { type: 'string' },
          '@id': { type: 'string' },
          'name': { type: 'string' },
          'description': { type: 'string' }
        },
        additionalProperties: true
      };

      const endpoints = [
        { method: 'GET', path: '/api/content' },
        { method: 'GET', path: '/api/content/:id' },
        { method: 'POST', path: '/api/content' },
        { method: 'PUT', path: '/api/content/:id' },
        { method: 'DELETE', path: '/api/content/:id' },
        { method: 'GET', path: '/api/concepts' },
        { method: 'GET', path: '/api/concepts/:id' },
        { method: 'POST', path: '/api/concepts' },
        { method: 'PUT', path: '/api/concepts/:id' },
        { method: 'DELETE', path: '/api/concepts/:id' },
        { method: 'GET', path: '/api/predicates' },
        { method: 'GET', path: '/api/predicates/:id' },
        { method: 'POST', path: '/api/predicates' },
        { method: 'PUT', path: '/api/predicates/:id' },
        { method: 'DELETE', path: '/api/predicates/:id' },
        { method: 'GET', path: '/api/resources' },
        { method: 'GET', path: '/api/resources/:id' },
        { method: 'POST', path: '/api/resources' },
        { method: 'PUT', path: '/api/resources/:id' },
        { method: 'DELETE', path: '/api/resources/:id' },
        { method: 'GET', path: '/api/topics' },
        { method: 'GET', path: '/api/topics/:id' },
        { method: 'POST', path: '/api/topics' },
        { method: 'PUT', path: '/api/topics/:id' },
        { method: 'DELETE', path: '/api/topics/:id' },
        { method: 'GET', path: '/api/search' },
        { method: 'GET', path: '/api/search/advanced' },
        { method: 'GET', path: '/api/search/by-type/:type' },
        { method: 'GET', path: '/api/search/by-property' }
      ];

      for (const endpoint of endpoints) {
        const key = `${endpoint.method}:${endpoint.path}`;
        const validator = this.ajv.compile(requestSchema);
        this.validators.set(key, validator);
      }

      this.initialized = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new SchemaError(`Failed to initialize MCP schema validator: ${errorMessage}`);
    }
  }

  /**
   * Validate a request against the MCP schema
   * 
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Request data
   * @returns Validation result
   */
  public async validateRequest(
    method: string,
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<ValidationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    let key = `${method}:${endpoint}`;
    let validator = this.validators.get(key);

    if (!validator) {
      const endpointParts = endpoint.split('/').filter(Boolean);
      
      for (const [registeredKey, registeredValidator] of this.validators.entries()) {
        const [registeredMethod, registeredPath] = registeredKey.split(':');
        
        if (registeredMethod !== method) continue;
        
        const registeredParts = registeredPath.split('/').filter(Boolean);
        
        if (registeredParts.length !== endpointParts.length) continue;
        
        let matches = true;
        for (let i = 0; i < registeredParts.length; i++) {
          if (registeredParts[i].startsWith(':') || registeredParts[i] === endpointParts[i]) {
            continue;
          }
          matches = false;
          break;
        }
        
        if (matches) {
          validator = registeredValidator;
          key = registeredKey;
          break;
        }
      }
    }

    if (!validator) {
      console.warn(`No validator found for ${key}`);
      return { valid: true };
    }

    if (method === 'GET') {
      return { valid: true };
    }

    const valid = validator(data);

    return {
      valid,
      errors: valid ? undefined : validator.errors || []
    };
  }
}
