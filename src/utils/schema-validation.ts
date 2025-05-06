/**
 * Schema Validation Utilities for UOR Content Management Client
 * Provides validation against JSON Schema and custom UOR-specific rules
 */

import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { UORContentItem, Concept, Predicate, Resource, Topic } from '../models';

/**
 * Validation result type with detailed error reporting
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Detailed validation error type
 */
export interface ValidationError {
  path: string;
  message: string;
  schemaPath?: string;
  code?: string;
}

/**
 * Error types for schema validation
 */
export class SchemaValidationError extends Error {
  constructor(
    message: string, 
    public readonly errors: ValidationError[] = []
  ) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Schema validator interface
 */
export interface SchemaValidator {
  validateContent(content: UORContentItem): ValidationResult;
  validateConcept(concept: Concept): ValidationResult;
  validatePredicate(predicate: Predicate): ValidationResult;
  validateResource(resource: Resource): ValidationResult;
  validateTopic(topic: Topic): ValidationResult;
  validatePartial(content: Partial<UORContentItem>, type: string): ValidationResult;
}

/**
 * Implementation of SchemaValidator using AJV
 */
export class AjvSchemaValidator implements SchemaValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();
  private partialValidators: Map<string, ValidateFunction> = new Map();
  
  constructor(schemas: Record<string, any>) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true
    });
    
    addFormats(this.ajv);
    
    for (const [name, schema] of Object.entries(schemas)) {
      this.ajv.addSchema(schema, name);
    }
    
    this.compileValidators(schemas);
  }
  
  /**
   * Compile validators for all schemas
   */
  private compileValidators(schemas: Record<string, any>): void {
    for (const [name, schema] of Object.entries(schemas)) {
      try {
        const validator = this.ajv.compile(schema);
        this.validators.set(name, validator);
        
        const partialSchema = this.createPartialSchema(schema);
        const partialValidator = this.ajv.compile(partialSchema);
        this.partialValidators.set(name, partialValidator);
      } catch (error) {
        console.error(`Error compiling schema ${name}:`, error);
      }
    }
  }
  
  /**
   * Create a partial schema for updates
   */
  private createPartialSchema(schema: any): any {
    const partialSchema = JSON.parse(JSON.stringify(schema));
    
    if (partialSchema.properties) {
      partialSchema.required = partialSchema.required 
        ? partialSchema.required.filter((prop: string) => prop === '@type')
        : [];
    }
    
    return partialSchema;
  }
  
  /**
   * Convert AJV errors to ValidationError format
   */
  private formatErrors(errors: ErrorObject[] | null | undefined): ValidationError[] {
    if (!errors) return [];
    
    return errors.map(error => ({
      path: error.instancePath || '/',
      message: error.message || 'Unknown error',
      schemaPath: error.schemaPath,
      code: error.keyword
    }));
  }
  
  /**
   * Validate content against schema
   */
  validateContent(content: UORContentItem): ValidationResult {
    const type = content['@type'];
    const validator = this.validators.get(type);
    
    if (!validator) {
      return {
        valid: false,
        errors: [{
          path: '/',
          message: `No validator found for type: ${type}`
        }]
      };
    }
    
    const valid = validator(content);
    const errors = this.formatErrors(validator.errors);
    
    return { valid: !!valid, errors };
  }
  
  /**
   * Validate concept against schema
   */
  validateConcept(concept: Concept): ValidationResult {
    const validator = this.validators.get('DefinedTerm');
    
    if (!validator) {
      return {
        valid: false,
        errors: [{
          path: '/',
          message: 'No validator found for Concept (DefinedTerm)'
        }]
      };
    }
    
    const valid = validator(concept);
    const errors = this.formatErrors(validator.errors);
    
    return { valid: !!valid, errors };
  }
  
  /**
   * Validate predicate against schema
   */
  validatePredicate(predicate: Predicate): ValidationResult {
    const validator = this.validators.get('PropertyValue');
    
    if (!validator) {
      return {
        valid: false,
        errors: [{
          path: '/',
          message: 'No validator found for Predicate (PropertyValue)'
        }]
      };
    }
    
    const valid = validator(predicate);
    const errors = this.formatErrors(validator.errors);
    
    return { valid: !!valid, errors };
  }
  
  /**
   * Validate resource against schema
   */
  validateResource(resource: Resource): ValidationResult {
    const validator = this.validators.get('CreativeWork');
    
    if (!validator) {
      return {
        valid: false,
        errors: [{
          path: '/',
          message: 'No validator found for Resource (CreativeWork)'
        }]
      };
    }
    
    const valid = validator(resource);
    const errors = this.formatErrors(validator.errors);
    
    return { valid: !!valid, errors };
  }
  
  /**
   * Validate topic against schema
   */
  validateTopic(topic: Topic): ValidationResult {
    const validator = this.validators.get('CreativeWork');
    
    if (!validator) {
      return {
        valid: false,
        errors: [{
          path: '/',
          message: 'No validator found for Topic (CreativeWork)'
        }]
      };
    }
    
    const valid = validator(topic);
    const errors = this.formatErrors(validator.errors);
    
    return { valid: !!valid, errors };
  }
  
  /**
   * Validate partial content (for updates)
   */
  validatePartial(content: Partial<UORContentItem>, type: string): ValidationResult {
    const validator = this.partialValidators.get(type);
    
    if (!validator) {
      return {
        valid: false,
        errors: [{
          path: '/',
          message: `No validator found for type: ${type}`
        }]
      };
    }
    
    const valid = validator(content);
    const errors = this.formatErrors(validator.errors);
    
    return { valid: !!valid, errors };
  }
}

/**
 * Schema loader for loading schemas from files or OpenAPI spec
 */
export class SchemaLoader {
  constructor(private readonly openApiPath: string) {}
  
  /**
   * Load schemas from OpenAPI specification
   */
  async loadSchemas(): Promise<Record<string, any>> {
    try {
      return {
        'DefinedTerm': {
          type: 'object',
          properties: {
            '@context': { type: 'string' },
            '@type': { const: 'DefinedTerm' },
            '@id': { type: 'string' },
            'name': { type: 'string' },
            'description': { type: 'string' },
            'termCode': { type: 'string' },
            'inDefinedTermSet': {
              type: 'object',
              properties: {
                '@type': { const: 'DefinedTermSet' },
                'name': { type: 'string' }
              },
              required: ['@type', 'name']
            }
          },
          required: ['@context', '@type', 'name', 'termCode', 'inDefinedTermSet']
        },
        'PropertyValue': {
          type: 'object',
          properties: {
            '@context': { 
              oneOf: [
                { type: 'string' },
                { type: 'object' }
              ]
            },
            '@type': { const: 'PropertyValue' },
            '@id': { type: 'string' },
            'name': { type: 'string' },
            'propertyID': { type: 'string' },
            'value': { type: 'string' },
            'subjectOf': {
              type: 'object',
              properties: {
                '@id': { type: 'string' }
              },
              required: ['@id']
            },
            'targetCollection': {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['@context', '@type', 'name', 'propertyID', 'value', 'subjectOf', 'targetCollection']
        },
        'CreativeWork': {
          type: 'object',
          properties: {
            '@context': { type: 'string' },
            '@type': { const: 'CreativeWork' },
            '@id': { type: 'string' },
            'name': { type: 'string' },
            'description': { type: 'string' }
          },
          required: ['@context', '@type', 'name']
        }
      };
    } catch (error) {
      console.error('Error loading schemas:', error);
      throw new Error('Failed to load schemas');
    }
  }
}

/**
 * Factory for creating schema validators
 */
export class SchemaValidatorFactory {
  /**
   * Create a schema validator
   */
  static async create(openApiPath: string): Promise<SchemaValidator> {
    const loader = new SchemaLoader(openApiPath);
    const schemas = await loader.loadSchemas();
    return new AjvSchemaValidator(schemas);
  }
}
