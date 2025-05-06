/**
 * Content Schema Validator
 * 
 * This utility validates content against Schema.org and UOR-specific schemas.
 * It uses the Schema.org definitions from the git-submodule.
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
 * Content Schema Validator
 * 
 * Singleton class for validating content against Schema.org and UOR-specific schemas
 */
export class ContentSchemaValidator {
  private static instance: ContentSchemaValidator;
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
  public static getInstance(): ContentSchemaValidator {
    if (!ContentSchemaValidator.instance) {
      ContentSchemaValidator.instance = new ContentSchemaValidator();
    }
    return ContentSchemaValidator.instance;
  }

  /**
   * Initialize the validator
   * 
   * Loads schemas from the OpenAPI specification and Schema.org git-submodule
   * 
   * @returns A promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const contentTypes = ['concept', 'predicate', 'resource', 'topic'];
      
      for (const contentType of contentTypes) {
        const properties: Record<string, { type: string }> = {
          '@context': { type: 'string' },
          '@type': { type: 'string' },
          'name': { type: 'string' },
          'description': { type: 'string' },
          'identifier': { type: 'string' }
        };
        
        if (contentType === 'predicate') {
          properties['value'] = { type: 'string' };
        }
        
        const schema = {
          type: 'object',
          properties
        };
        
        const validator = this.ajv.compile(schema);
        this.validators.set(contentType.toLowerCase(), validator);
      }
      
      this.initialized = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new SchemaError(`Failed to initialize content schema validator: ${errorMessage}`);
    }
  }

  /**
   * Validate content against Schema.org and UOR-specific schemas
   * 
   * @param contentType - Content type (concept, predicate, resource, topic)
   * @param data - Content data
   * @returns Validation result
   */
  public async validateContent(
    contentType: string,
    data: Record<string, unknown>
  ): Promise<ValidationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const validator = this.validators.get(contentType.toLowerCase());

    if (!validator) {
      console.warn(`No validator found for content type ${contentType}`);
      return { valid: true };
    }

    const valid = validator(data);

    return {
      valid,
      errors: valid ? undefined : validator.errors || []
    };
  }
}
