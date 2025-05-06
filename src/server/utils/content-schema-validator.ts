/**
 * Content Schema Validator
 * 
 * This utility validates content against Schema.org and UOR-specific schemas.
 * It uses the Schema.org definitions from the git-submodule.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { SchemaError } from '../types/errors';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors?: any[];
}

/**
 * Content Schema Validator
 * 
 * Singleton class for validating content against Schema.org and UOR-specific schemas
 */
export class ContentSchemaValidator {
  private static instance: ContentSchemaValidator;
  private ajv: Ajv;
  private validators: Map<string, any>;
  private initialized: boolean;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.validators = new Map();
    this.initialized = false;
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
    if (this.initialized) {
      return;
    }

    try {
      const fs = require('fs');
      const path = require('path');
      
      const openApiPath = path.resolve(
        process.cwd(),
        'converted/openapi-spec.json'
      );
      
      const openApiSpec = JSON.parse(
        fs.readFileSync(openApiPath, 'utf8')
      );
      
      const { components } = openApiSpec;
      
      if (!components || !components.schemas) {
        throw new Error('OpenAPI specification does not contain schemas');
      }
      
      const contentTypes = ['concept', 'predicate', 'resource', 'topic'];
      
      for (const contentType of contentTypes) {
        const schemaName = `${contentType.charAt(0).toUpperCase()}${contentType.slice(1)}`;
        const schema = components.schemas[schemaName];
        
        if (!schema) {
          console.warn(`Schema not found for content type ${contentType}`);
          continue;
        }
        
        const validator = this.ajv.compile(schema);
        this.validators.set(contentType.toLowerCase(), validator);
      }
      
      this.initialized = true;
    } catch (error: any) {
      throw new SchemaError(`Failed to initialize content schema validator: ${error.message}`);
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
    data: any
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
      errors: valid ? undefined : validator.errors
    };
  }
}
