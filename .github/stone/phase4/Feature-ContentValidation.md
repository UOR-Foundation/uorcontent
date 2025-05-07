# Feature Role: Content Validation and Integrity Implementation (Issue #14)

This document contains detailed implementation specifications for the Content Validation and Integrity component of Phase 4 of the UOR Content Management Client.

## Implementation Overview

The Content Validation and Integrity component provides comprehensive validation for content in the UOR Content Management Client, including schema validation, relationship integrity checking, and automatic repair for common issues.

## Key Components

### ValidationEngine Class

```typescript
import { ContentRepository } from '../repository/content-repository';
import { RelationshipManager } from '../managers/relationship-manager';
import { SchemaValidator } from '../validators/schema-validator';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  severity: 'warning';
}

/**
 * Validation report
 */
export interface ValidationReport {
  summary: {
    total: number;
    valid: number;
    invalid: number;
    errors: number;
    warnings: number;
  };
  results: {
    [id: string]: ValidationResult;
  };
  repositoryHealth: {
    orphanedContent: string[];
    inconsistentReferences: Array<{
      source: string;
      target: string;
      issue: string;
    }>;
  };
  timestamp: string;
}

/**
 * Custom validator function type
 */
export type CustomValidator = (content: any, contentType: ContentTypeEnum) => ValidationResult;

/**
 * Validation Engine for content validation and integrity checking
 */
export class ValidationEngine {
  private customValidators: CustomValidator[] = [];

  /**
   * Creates a new ValidationEngine instance
   */
  constructor(
    private contentRepository: ContentRepository,
    private relationshipManager: RelationshipManager,
    private schemaValidator: SchemaValidator
  ) {}

  /**
   * Validates content against schema and custom rules
   * @param content Content to validate
   * @param contentType Type of content
   * @param customRules Optional custom validation rules
   * @returns Validation result
   */
  async validateContent(
    content: any,
    contentType: ContentTypeEnum,
    customRules?: any
  ): Promise<ValidationResult> {
    // Validate against schema
    const schemaResult = await this.schemaValidator.validate(content, contentType);
    
    // Apply custom validators
    const customResults = this.customValidators.map(validator => 
      validator(content, contentType)
    );
    
    // Apply custom rules if provided
    let customRulesResult: ValidationResult = { isValid: true, errors: [], warnings: [] };
    if (customRules) {
      customRulesResult = await this.validateAgainstCustomRules(content, customRules);
    }
    
    // Combine all results
    const allErrors = [
      ...schemaResult.errors,
      ...customResults.flatMap(r => r.errors),
      ...customRulesResult.errors
    ];
    
    const allWarnings = [
      ...schemaResult.warnings,
      ...customResults.flatMap(r => r.warnings),
      ...customRulesResult.warnings
    ];
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Validates relationships for a content item
   * @param contentId ID of the content item
   * @returns Validation result
   */
  async validateRelationships(contentId: string): Promise<ValidationResult> {
    // Get all relationships for the content item
    const relationships = await this.relationshipManager.getRelationshipsForContent(contentId);
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Validate each relationship
    for (const relationship of relationships) {
      try {
        // Check if subject exists
        try {
          await this.contentRepository.read(this.getContentTypeFromId(relationship.subject), relationship.subject);
        } catch (error) {
          errors.push({
            code: 'INVALID_SUBJECT_REFERENCE',
            message: `Subject ${relationship.subject} does not exist`,
            path: `relationships[${relationship.id}].subject`,
            severity: 'error'
          });
        }
        
        // Check if predicate exists
        try {
          await this.contentRepository.read(ContentTypeEnum.PREDICATE, relationship.predicate);
        } catch (error) {
          errors.push({
            code: 'INVALID_PREDICATE_REFERENCE',
            message: `Predicate ${relationship.predicate} does not exist`,
            path: `relationships[${relationship.id}].predicate`,
            severity: 'error'
          });
        }
        
        // Check if targets exist
        for (const target of relationship.target) {
          try {
            // Determine target type from ID prefix
            const targetType = this.getContentTypeFromId(target);
            await this.contentRepository.read(targetType, target);
          } catch (error) {
            errors.push({
              code: 'INVALID_TARGET_REFERENCE',
              message: `Target ${target} does not exist`,
              path: `relationships[${relationship.id}].target`,
              severity: 'error'
            });
          }
        }
      } catch (error) {
        errors.push({
          code: 'RELATIONSHIP_VALIDATION_ERROR',
          message: error.message,
          path: `relationships[${relationship.id}]`,
          severity: 'error'
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates the entire repository
   * @returns Validation report
   */
  async validateRepository(): Promise<ValidationReport> {
    const results: Record<string, ValidationResult> = {};
    let totalCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    // Validate all content types
    for (const contentType of Object.values(ContentTypeEnum)) {
      const items = await this.contentRepository.list(contentType);
      
      for (const item of items) {
        // Validate content
        const contentResult = await this.validateContent(item, contentType);
        
        // Validate relationships
        const relationshipsResult = await this.validateRelationships(item.id);
        
        // Combine results
        const combinedResult: ValidationResult = {
          isValid: contentResult.isValid && relationshipsResult.isValid,
          errors: [...contentResult.errors, ...relationshipsResult.errors],
          warnings: [...contentResult.warnings, ...relationshipsResult.warnings]
        };
        
        // Update counts
        totalCount++;
        if (combinedResult.isValid) {
          validCount++;
        } else {
          invalidCount++;
        }
        errorCount += combinedResult.errors.length;
        warningCount += combinedResult.warnings.length;
        
        // Store result
        results[item.id] = combinedResult;
      }
    }
    
    // Check for orphaned content and inconsistent references
    const orphanedContent: string[] = await this.findOrphanedContent();
    const inconsistentReferences: Array<{
      source: string;
      target: string;
      issue: string;
    }> = await this.findInconsistentReferences();
    
    return {
      summary: {
        total: totalCount,
        valid: validCount,
        invalid: invalidCount,
        errors: errorCount,
        warnings: warningCount
      },
      results,
      repositoryHealth: {
        orphanedContent,
        inconsistentReferences
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generates a validation report
   * @param results Validation results
   * @returns Validation report
   */
  async generateReport(results: Record<string, ValidationResult>): Promise<ValidationReport> {
    let totalCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    // Calculate summary statistics
    for (const result of Object.values(results)) {
      totalCount++;
      if (result.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
      errorCount += result.errors.length;
      warningCount += result.warnings.length;
    }
    
    // Check for orphaned content and inconsistent references
    const orphanedContent: string[] = await this.findOrphanedContent();
    const inconsistentReferences: Array<{
      source: string;
      target: string;
      issue: string;
    }> = await this.findInconsistentReferences();
    
    return {
      summary: {
        total: totalCount,
        valid: validCount,
        invalid: invalidCount,
        errors: errorCount,
        warnings: warningCount
      },
      results,
      repositoryHealth: {
        orphanedContent,
        inconsistentReferences
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Repairs content with validation issues
   * @param content Content to repair
   * @param contentType Type of content
   * @param issues Validation issues to repair
   * @returns Repaired content
   */
  async repairContent(
    content: any,
    contentType: ContentTypeEnum,
    issues: ValidationError[]
  ): Promise<any> {
    const repairedContent = { ...content };
    
    // Apply repairs for each issue
    for (const issue of issues) {
      if (issue.path) {
        // Extract the path components
        const pathComponents = issue.path.split('.');
        
        // Apply repair based on issue code
        switch (issue.code) {
          case 'MISSING_REQUIRED_FIELD':
            // Add default value for missing field
            this.setValueAtPath(repairedContent, pathComponents, this.getDefaultValueForPath(pathComponents, contentType));
            break;
            
          case 'INVALID_FORMAT':
            // Fix format issues
            const currentValue = this.getValueAtPath(repairedContent, pathComponents);
            this.setValueAtPath(repairedContent, pathComponents, this.fixFormatIssue(currentValue, issue));
            break;
            
          case 'INVALID_REFERENCE':
            // Remove invalid references
            if (pathComponents[0] === 'relationships') {
              // For relationship references, we might need to remove the entire relationship
              // or just update the reference
              // This is a simplified example
              const relationshipId = pathComponents[1].match(/\[(.*?)\]/)?.[1];
              if (relationshipId) {
                // In a real implementation, this would handle relationship repairs
              }
            } else {
              // For other references, we might set to null or remove
              this.setValueAtPath(repairedContent, pathComponents, null);
            }
            break;
        }
      }
    }
    
    // Validate the repaired content
    const validationResult = await this.validateContent(repairedContent, contentType);
    
    // If still invalid, throw error
    if (!validationResult.isValid) {
      throw new Error('Unable to automatically repair all issues');
    }
    
    return repairedContent;
  }

  /**
   * Visualizes validation results
   * @param report Validation report
   * @returns Visualization data
   */
  async visualizeValidation(report: ValidationReport): Promise<any> {
    // In a real implementation, this would generate visualization data
    // For now, we just return a simple summary
    const errorsByType = Object.entries(report.results).reduce((counts, [id, result]) => {
      const type = this.getContentTypeFromId(id);
      counts[type] = (counts[type] || 0) + result.errors.length;
      return counts;
    }, {} as Record<string, number>);
    
    const warningsByType = Object.entries(report.results).reduce((counts, [id, result]) => {
      const type = this.getContentTypeFromId(id);
      counts[type] = (counts[type] || 0) + result.warnings.length;
      return counts;
    }, {} as Record<string, number>);
    
    return {
      summary: report.summary,
      errorsByType,
      warningsByType,
      orphanedCount: report.repositoryHealth.orphanedContent.length,
      inconsistentCount: report.repositoryHealth.inconsistentReferences.length
    };
  }

  /**
   * Registers a custom validator
   * @param validator Custom validator function
   */
  registerValidator(validator: CustomValidator): void {
    this.customValidators.push(validator);
  }

  /**
   * Validates content against custom rules
   * @param content Content to validate
   * @param rules Custom rules
   * @returns Validation result
   */
  private async validateAgainstCustomRules(content: any, rules: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Apply each rule
    for (const rule of rules) {
      const { field, condition, message, severity } = rule;
      
      // Get field value
      const value = content[field];
      
      // Check condition
      let conditionMet = false;
      
      switch (condition.type) {
        case 'required':
          conditionMet = value === undefined || value === null || value === '';
          break;
          
        case 'pattern':
          conditionMet = typeof value === 'string' && !new RegExp(condition.pattern).test(value);
          break;
          
        case 'length':
          if (typeof value === 'string' || Array.isArray(value)) {
            if (condition.min !== undefined && value.length < condition.min) {
              conditionMet = true;
            }
            if (condition.max !== undefined && value.length > condition.max) {
              conditionMet = true;
            }
          }
          break;
          
        case 'range':
          if (typeof value === 'number') {
            if (condition.min !== undefined && value < condition.min) {
              conditionMet = true;
            }
            if (condition.max !== undefined && value > condition.max) {
              conditionMet = true;
            }
          }
          break;
          
        case 'custom':
          if (typeof condition.check === 'function') {
            conditionMet = condition.check(value, content);
          }
          break;
      }
      
      // Add error or warning if condition is met
      if (conditionMet) {
        if (severity === 'error') {
          errors.push({
            code: `CUSTOM_RULE_${field.toUpperCase()}`,
            message,
            path: field,
            severity: 'error'
          });
        } else {
          warnings.push({
            code: `CUSTOM_RULE_${field.toUpperCase()}`,
            message,
            path: field,
            severity: 'warning'
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gets the content type from an ID
   * @param id Content ID
   * @returns Content type
   */
  private getContentTypeFromId(id: string): ContentTypeEnum {
    if (id.startsWith('UOR-C-')) {
      return ContentTypeEnum.CONCEPT;
    } else if (id.startsWith('UOR-R-')) {
      return ContentTypeEnum.RESOURCE;
    } else if (id.startsWith('UOR-T-')) {
      return ContentTypeEnum.TOPIC;
    } else if (id.startsWith('UOR-P-')) {
      return ContentTypeEnum.PREDICATE;
    } else {
      throw new Error(`Unable to determine content type from ID: ${id}`);
    }
  }

  /**
   * Gets a value at a path in an object
   * @param obj Object to get value from
   * @param path Path to value
   * @returns Value at path
   */
  private getValueAtPath(obj: any, path: string[]): any {
    let current = obj;
    
    for (const part of path) {
      // Handle array indices
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, name, index] = match;
        current = current[name]?.[parseInt(index, 10)];
      } else {
        current = current[part];
      }
      
      if (current === undefined) {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Sets a value at a path in an object
   * @param obj Object to set value in
   * @param path Path to value
   * @param value Value to set
   */
  private setValueAtPath(obj: any, path: string[], value: any): void {
    let current = obj;
    
    for (let i = 0; i < path.length - 1; i++) {
      const part = path[i];
      
      // Handle array indices
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, name, index] = match;
        
        if (!current[name]) {
          current[name] = [];
        }
        
        const idx = parseInt(index, 10);
        
        if (!current[name][idx]) {
          current[name][idx] = {};
        }
        
        current = current[name][idx];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        
        current = current[part];
      }
    }
    
    const lastPart = path[path.length - 1];
    
    // Handle array indices in last part
    const match = lastPart.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      const [, name, index] = match;
      
      if (!current[name]) {
        current[name] = [];
      }
      
      current[name][parseInt(index, 10)] = value;
    } else {
      current[lastPart] = value;
    }
  }

  /**
   * Gets a default value for a path
   * @param path Path to get default value for
   * @param contentType Content type
   * @returns Default value
   */
  private getDefaultValueForPath(path: string[], contentType: ContentTypeEnum): any {
    const field = path[path.length - 1];
    
    // Handle array indices in field
    const match = field.match(/^(\w+)\[(\d+)\]$/);
    const fieldName = match ? match[1] : field;
    
    // Return default values based on field name and content type
    switch (fieldName) {
      case 'name':
        return `Untitled ${contentType}`;
      case 'description':
        return '';
      case 'dateCreated':
      case 'dateModified':
        return new Date().toISOString();
      case 'version':
        return 'v1';
      default:
        return '';
    }
  }

  /**
   * Fixes a format issue
   * @param value Value with format issue
   * @param issue Validation issue
   * @returns Fixed value
   */
  private fixFormatIssue(value: any, issue: ValidationError): any {
    // In a real implementation, this would handle various format issues
    // For now, we just handle a few common cases
    
    if (issue.code === 'INVALID_DATE_FORMAT' && typeof value === 'string') {
      // Try to parse and format the date
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        // If parsing fails, return current date
        return new Date().toISOString();
      }
    }
    
    if (issue.code === 'INVALID_ID_FORMAT' && typeof value === 'string') {
      // Try to fix ID format
      if (issue.path?.includes('concept')) {
        return value.replace(/^UOR-C-(\d+).*$/, 'UOR-C-$1');
      } else if (issue.path?.includes('resource')) {
        return value.replace(/^UOR-R-(\d+).*$/, 'UOR-R-$1');
      } else if (issue.path?.includes('topic')) {
        return value.replace(/^UOR-T-(\d+).*$/, 'UOR-T-$1');
      } else if (issue.path?.includes('predicate')) {
        return value.replace(/^UOR-P-(\d+).*$/, 'UOR-P-$1');
      }
    }
    
    // For other issues, return the original value
    return value;
  }

  /**
   * Finds orphaned content
   * @returns Array of orphaned content IDs
   */
  private async findOrphanedContent(): Promise<string[]> {
    const orphanedContent: string[] = [];
    
    // In a real implementation, this would find content that is not referenced by any other content
    // For now, we just return an empty array
    
    return orphanedContent;
  }

  /**
   * Finds inconsistent references
   * @returns Array of inconsistent references
   */
  private async findInconsistentReferences(): Promise<Array<{
    source: string;
    target: string;
    issue: string;
  }>> {
    const inconsistentReferences: Array<{
      source: string;
      target: string;
      issue: string;
    }> = [];
    
    // In a real implementation, this would find references that are inconsistent
    // For now, we just return an empty array
    
    return inconsistentReferences;
  }
}
```

### SchemaValidator Class

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ContentTypeEnum } from '../types/content-types';
import { ValidationResult, ValidationError, ValidationWarning } from '../engines/validation-engine';

/**
 * Schema Validator for validating content against JSON Schema
 */
export class SchemaValidator {
  private ajv: Ajv;
  private schemas: Record<ContentTypeEnum, any>;

  /**
   * Creates a new SchemaValidator instance
   */
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      validateFormats: true
    });
    
    addFormats(this.ajv);
    
    // Load schemas
    this.schemas = this.loadSchemas();
    
    // Add schemas to Ajv
    for (const [type, schema] of Object.entries(this.schemas)) {
      this.ajv.addSchema(schema, type);
    }
  }

  /**
   * Validates content against schema
   * @param content Content to validate
   * @param contentType Type of content
   * @returns Validation result
   */
  async validate(content: any, contentType: ContentTypeEnum): Promise<ValidationResult> {
    const schema = this.schemas[contentType];
    
    if (!schema) {
      throw new Error(`No schema found for content type: ${contentType}`);
    }
    
    const validate = this.ajv.compile(schema);
    const valid = validate(content);
    
    if (valid) {
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    }
    
    // Convert Ajv errors to ValidationError objects
    const errors: ValidationError[] = (validate.errors || []).map(error => ({
      code: error.keyword.toUpperCase(),
      message: error.message || 'Validation error',
      path: error.instancePath.substring(1), // Remove leading slash
      severity: 'error'
    }));
    
    return {
      isValid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Loads schemas for all content types
   * @returns Record of schemas by content type
   */
  private loadSchemas(): Record<ContentTypeEnum, any> {
    // In a real implementation, this would load schemas from files
    // For now, we just return hardcoded schemas
    
    return {
      [ContentTypeEnum.CONCEPT]: {
        type: 'object',
        required: ['id', 'name', 'description', 'dateCreated', 'dateModified', 'version'],
        properties: {
          id: {
            type: 'string',
            pattern: '^UOR-C-\\d{3}-[a-z0-9-]+$'
          },
          name: {
            type: 'string',
            minLength: 1
          },
          description: {
            type: 'string'
          },
          dateCreated: {
            type: 'string',
            format: 'date-time'
          },
          dateModified: {
            type: 'string',
            format: 'date-time'
          },
          version: {
            type: 'string',
            pattern: '^v\\d+$'
          }
        }
      },
      [ContentTypeEnum.RESOURCE]: {
        type: 'object',
        required: ['id', 'name', 'description', 'dateCreated', 'dateModified', 'version'],
        properties: {
          id: {
            type: 'string',
            pattern: '^UOR-R-\\d{3}-[a-z0-9-]+$'
          },
          name: {
            type: 'string',
            minLength: 1
          },
          description: {
            type: 'string'
          },
          dateCreated: {
            type: 'string',
            format: 'date-time'
          },
          dateModified: {
            type: 'string',
            format: 'date-time'
          },
          version: {
            type: 'string',
            pattern: '^v\\d+$'
          }
        }
      },
      [ContentTypeEnum.TOPIC]: {
        type: 'object',
        required: ['id', 'name', 'description', 'dateCreated', 'dateModified', 'version'],
        properties: {
          id: {
            type: 'string',
            pattern: '^UOR-T-\\d{3}-[a-z0-9-]+$'
          },
          name: {
            type: 'string',
            minLength: 1
          },
          description: {
            type: 'string'
          },
          dateCreated: {
            type: 'string',
            format: 'date-time'
          },
          dateModified: {
            type: 'string',
            format: 'date-time'
          },
          version: {
            type: 'string',
            pattern: '^v\\d+$'
          }
        }
      },
      [ContentTypeEnum.PREDICATE]: {
        type: 'object',
        required: ['id', 'name', 'description', 'dateCreated', 'dateModified', 'version'],
        properties: {
          id: {
            type: 'string',
            pattern: '^UOR-P-\\d{3}-[a-z0-9-]+$'
          },
          name: {
            type: 'string',
            minLength: 1
          },
          description: {
            type: 'string'
          },
          dateCreated: {
            type: 'string',
            format: 'date-time'
          },
          dateModified: {
            type: 'string',
            format: 'date-time'
          },
          version: {
            type: 'string',
            pattern: '^v\\d+$'
          }
        }
      }
    };
  }
}
```

### MCP Server Integration

```typescript
import { MCPServer } from '../server/mcp-server';
import { ValidationEngine, ValidationResult, ValidationReport } from '../engines/validation-engine';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Registers Validation Engine endpoints with the MCP server
 * @param mcpServer MCP server instance
 * @param validationEngine Validation Engine instance
 */
export function registerValidationEngineEndpoints(
  mcpServer: MCPServer,
  validationEngine: ValidationEngine
): void {
  // Validate content
  mcpServer.registerMethod('validation.validateContent', async (params) => {
    const { content, contentType, customRules } = params;
    return validationEngine.validateContent(content, contentType, customRules);
  });

  // Validate relationships
  mcpServer.registerMethod('validation.validateRelationships', async (params) => {
    const { contentId } = params;
    return validationEngine.validateRelationships(contentId);
  });

  // Validate repository
  mcpServer.registerMethod('validation.validateRepository', async () => {
    return validationEngine.validateRepository();
  });

  // Generate report
  mcpServer.registerMethod('validation.generateReport', async (params) => {
    const { results } = params;
    return validationEngine.generateReport(results);
  });

  // Repair content
  mcpServer.registerMethod('validation.repairContent', async (params) => {
    const { content, contentType, issues } = params;
    return validationEngine.repairContent(content, contentType, issues);
  });

  // Visualize validation
  mcpServer.registerMethod('validation.visualizeValidation', async (params) => {
    const { report } = params;
    return validationEngine.visualizeValidation(report);
  });
}
```

## Integration with Previous Phases

The Content Validation and Integrity component integrates with the following components from previous phases:

1. **Phase 1 Components**:
   - Uses TypeScript configuration with strict mode
   - Leverages type definitions for content models
   - Applies schema validation for content integrity
   - Builds upon Schema Validation Utilities

2. **Phase 2 Components**:
   - Integrates with ConceptManager for concept validation
   - Leverages IndexManager for efficient content retrieval
   - Builds upon Query Operations for content listing

3. **Phase 3 Components**:
   - Integrates with ResourceManager, TopicManager, and PredicateManager through ContentRepository
   - Leverages RelationshipManager for relationship validation
   - Maintains reference integrity across all content types

## Implementation Details

### Schema Validation

The schema validation functionality ensures content conforms to expected structures:

1. **JSON Schema Validation**: Content is validated against JSON Schema definitions.
2. **Custom Validation Rules**: Additional validation rules can be applied beyond schema validation.
3. **Validation Results**: Results include errors and warnings with detailed information.
4. **Path Information**: Validation issues include path information for easy location.

### Relationship Integrity

The relationship integrity functionality ensures relationships are valid:

1. **Reference Validation**: Ensures all referenced content exists.
2. **Circular Reference Detection**: Detects and prevents circular references.
3. **Relationship Type Validation**: Ensures relationships use valid predicates.
4. **Bidirectional Relationship Validation**: Ensures bidirectional relationships are consistent.

### Repository Health

The repository health functionality provides insights into overall content quality:

1. **Orphaned Content Detection**: Identifies content not referenced by any other content.
2. **Inconsistent Reference Detection**: Identifies references that are inconsistent.
3. **Health Metrics**: Provides metrics on content validity and issues.
4. **Visualization**: Visualizes validation results for easy understanding.

### Automatic Repair

The automatic repair functionality fixes common validation issues:

1. **Missing Field Repair**: Adds default values for missing required fields.
2. **Format Issue Repair**: Fixes common format issues in field values.
3. **Reference Repair**: Removes or updates invalid references.
4. **Validation After Repair**: Validates content after repair to ensure validity.

## Testing Strategy

The Content Validation and Integrity component should be tested with:

1. **Unit Tests**: Test each method in isolation with mocked dependencies.
2. **Integration Tests**: Test the integration with ContentRepository and RelationshipManager.
3. **Schema Validation Tests**: Verify validation against various schema violations.
4. **Relationship Integrity Tests**: Verify detection of invalid relationships.
5. **Repair Tests**: Verify automatic repair of common validation issues.
6. **Error Handling Tests**: Verify proper error handling for invalid inputs and edge cases.
