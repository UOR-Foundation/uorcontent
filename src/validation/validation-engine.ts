/**
 * Content Validation and Integrity Engine
 * Implements Issue #14
 */

import { ContentType, ContentItem, ValidationResult, ValidationError } from '../types';
import { ContentRepository } from '../repository/content-repository';
import { SchemaValidator, ValidationResult as SchemaValidationResult } from '../utils/schema-validation';

/**
 * Validation options interface
 */
export interface ValidationOptions {
  validateRelationships?: boolean;
  repairMode?: boolean;
  strictMode?: boolean;
}

/**
 * Validation report interface
 */
export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  repaired?: Array<{
    item: ContentItem;
    type: ContentType;
    repairs: string[];
  }>;
}

/**
 * Content Validation and Integrity Engine
 * Provides comprehensive validation for content, including schema validation,
 * relationship integrity checking, and automatic repair for common issues
 */
export class ValidationEngine {
  private repository: ContentRepository;
  private schemaValidator: SchemaValidator;

  /**
   * Creates a new ValidationEngine instance
   * @param repository Content repository instance
   * @param schemaValidator Schema validator instance
   */
  constructor(repository: ContentRepository, schemaValidator: SchemaValidator) {
    this.repository = repository;
    this.schemaValidator = schemaValidator;
  }

  /**
   * Validates a content item
   * @param contentType Content type
   * @param content Content item
   * @param options Validation options
   * @returns Validation result
   */
  public async validateItem(
    contentType: ContentType,
    content: ContentItem,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // Schema validation using the appropriate method based on content type
    let schemaValidationResult: SchemaValidationResult;
    
    switch (contentType) {
      case 'concept':
        schemaValidationResult = this.schemaValidator.validateConcept(content as any);
        break;
      case 'resource':
        schemaValidationResult = this.schemaValidator.validateResource(content as any);
        break;
      case 'topic':
        schemaValidationResult = this.schemaValidator.validateTopic(content as any);
        break;
      case 'predicate':
        schemaValidationResult = this.schemaValidator.validatePredicate(content as any);
        break;
      default:
        schemaValidationResult = this.schemaValidator.validateContent(content as any);
    }
    
    const schemaResult: ValidationResult = {
      valid: schemaValidationResult.valid,
      errors: schemaValidationResult.errors ? schemaValidationResult.errors.map(err => ({
        path: err.path,
        message: err.message,
        code: err.code || 'VALIDATION_ERROR'
      })) : undefined
    };
    
    if (!schemaResult.valid) {
      errors.push(...(schemaResult.errors || []));
    }
    
    if (options.validateRelationships && contentType === 'relationship') {
      const relationshipErrors = await this.validateRelationshipReferences(content);
      errors.push(...relationshipErrors);
    }
    
    const customErrors = this.applyCustomValidationRules(contentType, content);
    errors.push(...customErrors);
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates all content of a specific type
   * @param contentType Content type
   * @param options Validation options
   * @returns Validation report
   */
  public async validateContentType(
    contentType: ContentType,
    options: ValidationOptions = {}
  ): Promise<ValidationReport> {
    const items = await this.repository.listContent(contentType);
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const repaired: Array<{
      item: ContentItem;
      type: ContentType;
      repairs: string[];
    }> = [];
    
    for (const item of items) {
      const itemResult = await this.validateItem(contentType, item, options);
      
      if (!itemResult.valid && itemResult.errors) {
        for (const error of itemResult.errors) {
          if (error.code.startsWith('WARNING_')) {
            warnings.push({
              ...error,
              path: `${item.id || 'unknown'}.${error.path}`
            });
          } else {
            errors.push({
              ...error,
              path: `${item.id || 'unknown'}.${error.path}`
            });
          }
        }
        
        if (options.repairMode) {
          const repairResult = await this.repairItem(contentType, item, itemResult.errors);
          
          if (repairResult.repaired) {
            repaired.push({
              item: repairResult.item,
              type: contentType,
              repairs: repairResult.repairs
            });
            
            await this.repository.updateContent(contentType, item.id as string, repairResult.item);
          }
        }
      }
    }
    
    if (options.validateRelationships && contentType !== 'relationship') {
      const relationshipErrors = await this.validateContentRelationships(contentType, items);
      errors.push(...relationshipErrors);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      repaired: repaired.length > 0 ? repaired : undefined
    };
  }

  /**
   * Validates the entire repository
   * @param options Validation options
   * @returns Validation report
   */
  public async validateRepository(options: ValidationOptions = {}): Promise<ValidationReport> {
    const contentTypes: ContentType[] = ['concept', 'resource', 'topic', 'predicate', 'relationship'];
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const repaired: Array<{
      item: ContentItem;
      type: ContentType;
      repairs: string[];
    }> = [];
    
    for (const contentType of contentTypes) {
      const report = await this.validateContentType(contentType, options);
      
      errors.push(...report.errors);
      warnings.push(...report.warnings);
      
      if (report.repaired) {
        repaired.push(...report.repaired);
      }
    }
    
    const globalErrors = await this.validateGlobalIntegrity();
    errors.push(...globalErrors);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      repaired: repaired.length > 0 ? repaired : undefined
    };
  }

  /**
   * Repairs a content item
   * @param contentType Content type
   * @param item Content item
   * @param errors Validation errors
   * @returns Repair result
   */
  private async repairItem(
    contentType: ContentType,
    item: ContentItem,
    errors?: ValidationError[]
  ): Promise<{
    repaired: boolean;
    item: ContentItem;
    repairs: string[];
  }> {
    if (!errors || errors.length === 0) {
      return { repaired: false, item, repairs: [] };
    }
    
    const repairedItem = { ...item };
    const repairs: string[] = [];
    let repaired = false;
    
    for (const error of errors) {
      switch (error.code) {
        case 'MISSING_REQUIRED_FIELD':
          const fieldName = error.path.split('.').pop() || '';
          
          if (fieldName) {
            if (fieldName === 'name' && !repairedItem.name) {
              repairedItem.name = `Untitled ${contentType}`;
              repairs.push(`Added default name: "${repairedItem.name}"`);
              repaired = true;
            } else if (fieldName === 'description' && !repairedItem.description) {
              repairedItem.description = `Description for ${repairedItem.name || 'untitled item'}`;
              repairs.push(`Added default description`);
              repaired = true;
            }
          }
          break;
          
        case 'INVALID_FORMAT':
          const pathParts = error.path.split('.');
          const field = pathParts[pathParts.length - 1];
          
          if (field === 'id' && typeof repairedItem.id === 'string') {
            const fixedId = repairedItem.id.replace(/[^a-zA-Z0-9-_]/g, '-');
            if (fixedId !== repairedItem.id) {
              repairedItem.id = fixedId;
              repairs.push(`Fixed invalid ID format: "${fixedId}"`);
              repaired = true;
            }
          }
          break;
          
        case 'DUPLICATE_ID':
          if (repairedItem.id) {
            const timestamp = Date.now();
            repairedItem.id = `${repairedItem.id}-${timestamp}`;
            repairs.push(`Generated new unique ID: "${repairedItem.id}"`);
            repaired = true;
          }
          break;
      }
    }
    
    return { repaired, item: repairedItem, repairs };
  }

  /**
   * Validates relationship references
   * @param relationship Relationship content item
   * @returns Validation errors
   */
  private async validateRelationshipReferences(relationship: ContentItem): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    if (relationship.sourceId) {
      const source = await this.repository.readContent('concept', relationship.sourceId as string) ||
                    await this.repository.readContent('resource', relationship.sourceId as string) ||
                    await this.repository.readContent('topic', relationship.sourceId as string);
      
      if (!source) {
        errors.push({
          path: 'sourceId',
          message: `Source item with ID "${relationship.sourceId}" does not exist`,
          code: 'INVALID_REFERENCE'
        });
      }
    }
    
    if (relationship.targetId) {
      const target = await this.repository.readContent('concept', relationship.targetId as string) ||
                    await this.repository.readContent('resource', relationship.targetId as string) ||
                    await this.repository.readContent('topic', relationship.targetId as string);
      
      if (!target) {
        errors.push({
          path: 'targetId',
          message: `Target item with ID "${relationship.targetId}" does not exist`,
          code: 'INVALID_REFERENCE'
        });
      }
    }
    
    if (relationship.predicateId) {
      const predicate = await this.repository.readContent('predicate', relationship.predicateId as string);
      
      if (!predicate) {
        errors.push({
          path: 'predicateId',
          message: `Predicate with ID "${relationship.predicateId}" does not exist`,
          code: 'INVALID_REFERENCE'
        });
      }
    }
    
    return errors;
  }

  /**
   * Validates relationships for content items
   * @param contentType Content type
   * @param items Content items
   * @returns Validation errors
   */
  private async validateContentRelationships(
    contentType: ContentType,
    items: ContentItem[]
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    const relationships = await this.repository.listContent('relationship');
    
    for (const relationship of relationships) {
      if (
        (relationship.sourceId && relationship.sourceType === contentType) ||
        (relationship.targetId && relationship.targetType === contentType)
      ) {
        const itemIds = items.map(item => item.id);
        
        if (
          relationship.sourceType === contentType &&
          relationship.sourceId &&
          !itemIds.includes(relationship.sourceId)
        ) {
          errors.push({
            path: `relationship.${relationship.id}.sourceId`,
            message: `Relationship references non-existent ${contentType} with ID "${relationship.sourceId}"`,
            code: 'DANGLING_REFERENCE'
          });
        }
        
        if (
          relationship.targetType === contentType &&
          relationship.targetId &&
          !itemIds.includes(relationship.targetId)
        ) {
          errors.push({
            path: `relationship.${relationship.id}.targetId`,
            message: `Relationship references non-existent ${contentType} with ID "${relationship.targetId}"`,
            code: 'DANGLING_REFERENCE'
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Validates global integrity constraints
   * @returns Validation errors
   */
  private async validateGlobalIntegrity(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    try {
      const relationships = await this.repository.listContent('relationship');
      const graph = this.buildRelationshipGraph(relationships);
      const cycles = this.detectCycles(graph);
      
      for (const cycle of cycles) {
        errors.push({
          path: 'relationships',
          message: `Circular reference detected: ${cycle.join(' -> ')}`,
          code: 'CIRCULAR_REFERENCE'
        });
      }
    } catch (error) {
      errors.push({
        path: 'relationships',
        message: `Failed to validate relationship graph: ${(error as Error).message}`,
        code: 'VALIDATION_ERROR'
      });
    }
    
    return errors;
  }

  /**
   * Applies custom validation rules
   * @param contentType Content type
   * @param content Content item
   * @returns Validation errors
   */
  private applyCustomValidationRules(contentType: ContentType, content: ContentItem): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (content.name !== undefined && typeof content.name === 'string') {
      if (content.name.trim().length === 0) {
        errors.push({
          path: 'name',
          message: 'Name cannot be empty',
          code: 'EMPTY_NAME'
        });
      } else if (content.name.trim().length < 3) {
        errors.push({
          path: 'name',
          message: 'Name is too short (minimum 3 characters)',
          code: 'WARNING_SHORT_NAME'
        });
      }
    }
    
    if (content.description !== undefined && typeof content.description === 'string') {
      if (content.description.trim().length > 0 && content.description.trim().length < 10) {
        errors.push({
          path: 'description',
          message: 'Description is very short (recommended minimum 10 characters)',
          code: 'WARNING_SHORT_DESCRIPTION'
        });
      }
    }
    
    switch (contentType) {
      case 'concept':
        if (!content.definition) {
          errors.push({
            path: 'definition',
            message: 'Concept should have a definition',
            code: 'WARNING_MISSING_DEFINITION'
          });
        }
        break;
        
      case 'resource':
        if (!content.url && !content.content) {
          errors.push({
            path: 'url/content',
            message: 'Resource should have either a URL or content',
            code: 'MISSING_RESOURCE_CONTENT'
          });
        }
        break;
        
      case 'relationship':
        if (!content.sourceId) {
          errors.push({
            path: 'sourceId',
            message: 'Relationship must have a source',
            code: 'MISSING_REQUIRED_FIELD'
          });
        }
        
        if (!content.targetId) {
          errors.push({
            path: 'targetId',
            message: 'Relationship must have a target',
            code: 'MISSING_REQUIRED_FIELD'
          });
        }
        
        if (!content.predicateId) {
          errors.push({
            path: 'predicateId',
            message: 'Relationship must have a predicate',
            code: 'MISSING_REQUIRED_FIELD'
          });
        }
        break;
    }
    
    return errors;
  }

  /**
   * Builds a relationship graph
   * @param relationships Relationship content items
   * @returns Relationship graph
   */
  private buildRelationshipGraph(relationships: ContentItem[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const relationship of relationships) {
      const sourceId = relationship.sourceId as string;
      const targetId = relationship.targetId as string;
      
      if (sourceId && targetId) {
        if (!graph.has(sourceId)) {
          graph.set(sourceId, []);
        }
        
        graph.get(sourceId)?.push(targetId);
      }
    }
    
    return graph;
  }

  /**
   * Detects cycles in a relationship graph
   * @param graph Relationship graph
   * @returns Detected cycles
   */
  private detectCycles(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (nodeId: string, path: string[] = []): void => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push([...path.slice(cycleStart), nodeId]);
        return;
      }
      
      if (visited.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path]);
      }
      
      recursionStack.delete(nodeId);
    };
    
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
    
    return cycles;
  }
}
