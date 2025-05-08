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
          jsonrpc: { type: 'string', enum: ['2.0'] },
          id: { type: ['string', 'number'] },
          method: { type: 'string' },
          params: { type: 'object', additionalProperties: true }
        },
        required: ['jsonrpc', 'id', 'method'],
        additionalProperties: false
      };
      
      const responseSchema = {
        type: 'object',
        properties: {
          jsonrpc: { type: 'string', enum: ['2.0'] },
          id: { type: ['string', 'number'] },
          result: { type: 'object', additionalProperties: true }
        },
        required: ['jsonrpc', 'id', 'result'],
        additionalProperties: false
      };
      
      const errorSchema = {
        type: 'object',
        properties: {
          jsonrpc: { type: 'string', enum: ['2.0'] },
          id: { type: ['string', 'number'] },
          error: {
            type: 'object',
            properties: {
              code: { type: 'number' },
              message: { type: 'string' },
              data: { type: 'object', additionalProperties: true }
            },
            required: ['code', 'message'],
            additionalProperties: false
          }
        },
        required: ['jsonrpc', 'id', 'error'],
        additionalProperties: false
      };
      
      this.validators.set('request', this.ajv.compile(requestSchema));
      this.validators.set('response', this.ajv.compile(responseSchema));
      this.validators.set('error', this.ajv.compile(errorSchema));

      this.initialized = true;
      console.log('MCP schema validator initialized with JSON-RPC validators');
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

    if (method === 'GET') {
      return { valid: true };
    }

    const validator = this.validators.get('request');
    
    if (!validator) {
      console.warn(`Request validator not found`);
      return { valid: true };
    }

    const valid = validator(data);

    return {
      valid,
      errors: valid ? undefined : validator.errors || []
    };
  }
}
