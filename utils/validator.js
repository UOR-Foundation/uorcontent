/**
 * Schema.org Content Validator
 * 
 * Validates JSON content against Schema.org types and custom templates
 */

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class SchemaValidator {
  constructor(templatesDir, options = {}) {
    this.templatesDir = templatesDir;
    this.ajv = new Ajv({
      allErrors: true,
      strict: options.strict || false,
      validateFormats: true
    });
    
    addFormats(this.ajv);
    this.schemas = {};
    this.templateSchemas = {};
  }

  /**
   * Initialize the validator by loading schemas
   */
  async initialize() {
    // Load built-in Schema.org schemas
    await this.loadSchemaOrgDefinitions();
    
    // Load template-based schemas
    await this.loadTemplateSchemas();
    
    return this;
  }

  /**
   * Load Schema.org definitions
   * In a real implementation, these would be loaded from schema.org sources
   */
  async loadSchemaOrgDefinitions() {
    // Simplified Schema.org type definitions
    const baseSchemas = {
      'CreativeWork': {
        type: 'object',
        properties: {
          '@context': { type: 'string' },
          '@type': { type: 'string' },
          '@id': { type: 'string' },
          'name': { type: 'string' },
          'description': { type: 'string' },
          'author': { },
          'dateCreated': { type: 'string', format: 'date-time' },
          'dateModified': { type: 'string', format: 'date-time' },
          'isPartOf': { },
          'hasPart': { type: 'array' },
          'about': { },
          'keywords': { type: 'array' },
          'text': { type: 'string' }
        },
        required: ['@context', '@type', 'name'],
        additionalProperties: true
      },
      'DefinedTerm': {
        type: 'object',
        properties: {
          '@context': { type: 'string' },
          '@type': { type: 'string' },
          '@id': { type: 'string' },
          'name': { type: 'string' },
          'description': { type: 'string' },
          'termCode': { type: 'string' },
          'inDefinedTermSet': { },
          'sameAs': { oneOf: [{type: 'string'}, {type: 'array'}] }
        },
        required: ['@context', '@type', 'name'],
        additionalProperties: true
      },
      'PropertyValue': {
        type: 'object',
        properties: {
          '@context': { },
          '@type': { type: 'string' },
          '@id': { type: 'string' },
          'name': { type: 'string' },
          'propertyID': { type: 'string' },
          'value': { },
          'subjectOf': { },
          'targetCollection': { type: 'array' },
          'valueName': { type: 'string' },
          'additionalProperty': { type: 'array' }
        },
        required: ['@type', 'name', 'value'],
        additionalProperties: true
      },
      'ItemList': {
        type: 'object',
        properties: {
          '@context': { type: 'string' },
          '@type': { type: 'string' },
          'numberOfItems': { type: 'number' },
          'itemListElement': { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                '@type': { type: 'string' },
                'position': { type: 'number' },
                'item': { type: 'object' }
              },
              required: ['@type', 'position', 'item'],
              additionalProperties: true
            }
          }
        },
        required: ['@context', '@type', 'itemListElement'],
        additionalProperties: true
      }
    };
    
    for (const [type, schema] of Object.entries(baseSchemas)) {
      this.schemas[type] = schema;
      this.ajv.addSchema(schema, type);
    }
  }

  /**
   * Load schemas from template files
   */
  async loadTemplateSchemas() {
    try {
      const templates = [
        'InformationResource.json',
        'Concept.json',
        'Topic.json',
        'FactPredicate.json'
      ];
      
      for (const templateName of templates) {
        const templatePath = path.join(this.templatesDir, templateName);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        const template = JSON.parse(templateContent);
        
        // Create a schema based on the template
        const schema = this.createSchemaFromTemplate(template);
        const typeName = templateName.replace('.json', '');
        
        this.templateSchemas[typeName] = schema;
        this.ajv.addSchema(schema, typeName);
      }
    } catch (error) {
      console.error('Error loading template schemas:', error.message);
      throw error;
    }
  }

  /**
   * Create a JSON Schema from a template
   */
  createSchemaFromTemplate(template) {
    const schema = {
      type: 'object',
      properties: {},
      required: ['@context', '@type'],
      additionalProperties: true
    };
    
    // For each property in the template, define a schema rule
    for (const [key, value] of Object.entries(template)) {
      if (key === '@context' || key === '@type') {
        schema.properties[key] = { type: 'string' };
        continue;
      }
      
      if (typeof value === 'string') {
        schema.properties[key] = { type: 'string' };
      } else if (Array.isArray(value)) {
        schema.properties[key] = { type: 'array' };
      } else if (typeof value === 'object' && value !== null) {
        schema.properties[key] = { 
          type: 'object',
          additionalProperties: true
        };
      } else if (typeof value === 'number') {
        schema.properties[key] = { type: 'number' };
      } else if (typeof value === 'boolean') {
        schema.properties[key] = { type: 'boolean' };
      }
    }
    
    return schema;
  }

  /**
   * Validate content against schema and perform additional validation checks
   */
  validate(content, schemaType = null, contentIndex = {}) {
    let type = schemaType;
    
    if (!type && content['@type']) {
      type = content['@type'];
    }
    
    if (!type) {
      throw new Error('Schema type not specified and cannot be determined from content');
    }
    
    // Try template schema first, then Schema.org schema
    let validate;
    if (type in this.templateSchemas) {
      validate = this.ajv.getSchema(type);
    } else if (type in this.schemas) {
      validate = this.ajv.getSchema(type);
    } else {
      throw new Error(`Unknown schema type: ${type}`);
    }
    
    // Schema validation
    const schemaValid = validate(content);
    const errors = [...(validate.errors || [])];
    
    // Additional validation checks
    const additionalChecks = this.performAdditionalValidation(content, type, contentIndex);
    const valid = schemaValid && additionalChecks.valid;
    
    if (!additionalChecks.valid) {
      errors.push(...additionalChecks.errors);
    }
    
    return {
      valid,
      errors,
      type,
      warnings: additionalChecks.warnings || []
    };
  }
  
  /**
   * Perform additional validation beyond schema compliance
   */
  performAdditionalValidation(content, type, contentIndex = {}) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check for required properties based on type
    switch (type) {
      case 'DefinedTerm':
      case 'Concept':
        this.validateConcept(content, result, contentIndex);
        break;
      case 'CreativeWork':
      case 'InformationResource':
      case 'Topic':
        this.validateCreativeWork(content, result, contentIndex);
        break;
      case 'PropertyValue':
      case 'FactPredicate':
        this.validatePredicate(content, result, contentIndex);
        break;
    }
    
    // Common validations for all types
    this.validateCommon(content, result, contentIndex);
    
    return result;
  }
  
  /**
   * Validate concept-specific requirements
   */
  validateConcept(concept, result, contentIndex) {
    // Check termCode uniqueness if index available
    if (contentIndex.concepts && concept.termCode) {
      const duplicate = contentIndex.concepts.find(c => 
        c.termCode === concept.termCode && c['@id'] !== concept['@id']
      );
      
      if (duplicate) {
        result.errors.push({
          message: `Duplicate termCode: "${concept.termCode}" also used in concept "${duplicate.name}"`
        });
        result.valid = false;
      }
    }
    
    // Check for required mathematical content for math concepts
    if (concept.mathExpression && concept.mathExpression.length === 0 && concept.name.toLowerCase().includes('math')) {
      result.warnings.push({
        message: `Concept "${concept.name}" appears to be mathematical but has no mathExpression content`
      });
    }
    
    // Check for related concepts validity
    if (concept.relatedConcepts && concept.relatedConcepts.length > 0) {
      concept.relatedConcepts.forEach(relatedId => {
        if (!this.isValidResourceId(relatedId, 'concept', contentIndex)) {
          result.warnings.push({
            message: `Related concept with ID "${relatedId}" could not be verified in the index`
          });
        }
      });
    }
  }
  
  /**
   * Validate creative work (information resource or topic) specific requirements
   */
  validateCreativeWork(resource, result, contentIndex) {
    // Check for empty text content
    if ((resource['@type'] === 'InformationResource' || resource['@type'] === 'CreativeWork') && 
        !resource.text && !resource.hasPart?.length) {
      result.warnings.push({
        message: `Resource "${resource.name}" has no text content or child parts`
      });
    }
    
    // Check for hasPart references
    if (resource.hasPart && resource.hasPart.length > 0) {
      resource.hasPart.forEach(part => {
        // Handle both string IDs and object references
        const partId = typeof part === 'string' ? part : (part['@id'] || part);
        
        if (typeof partId === 'string') {
          if (!this.isValidResourceId(partId, null, contentIndex)) {
            result.warnings.push({
              message: `hasPart reference with ID "${partId}" could not be verified in the index`
            });
          }
        } else if (typeof part === 'object') {
          // For object references, just warn if they're not in the right format
          if (!part['@id'] || typeof part['@id'] !== 'string') {
            result.warnings.push({
              message: `hasPart contains an object without a valid @id: ${JSON.stringify(part)}`
            });
          }
        }
      });
    }
    
    // Validate topic-specific properties
    if (resource['@type'] === 'Topic' || resource.learningResourceType === 'Topic') {
      // Check for URL template
      if (!resource.potentialAction?.target?.urlTemplate) {
        result.warnings.push({
          message: `Topic "${resource.name}" is missing a urlTemplate in potentialAction.target`
        });
      }
    }
    
    // Check for isPartOf reference
    if (resource.isPartOf && resource.isPartOf['@id'] && 
        !this.isValidResourceId(resource.isPartOf['@id'], null, contentIndex)) {
      result.warnings.push({
        message: `isPartOf reference with ID "${resource.isPartOf['@id']}" could not be verified in the index`
      });
    }
  }
  
  /**
   * Validate predicate-specific requirements
   */
  validatePredicate(predicate, result, contentIndex) {
    // Check for valid subject reference
    if (predicate.subjectOf && predicate.subjectOf['@id'] && 
        !this.isValidResourceId(predicate.subjectOf['@id'], null, contentIndex)) {
      result.errors.push({
        message: `Subject reference with ID "${predicate.subjectOf['@id']}" could not be verified in the index`
      });
      result.valid = false;
    }
    
    // Check for valid target references
    if (predicate.targetCollection && predicate.targetCollection.length > 0) {
      predicate.targetCollection.forEach(targetId => {
        if (!this.isValidResourceId(targetId, null, contentIndex)) {
          result.errors.push({
            message: `Target reference with ID "${targetId}" could not be verified in the index`
          });
          result.valid = false;
        }
      });
    }
    
    // Check for consistency between name and valueReference
    // Skip this check if valueReference.name is "relation strength" as this is a common pattern
    if (predicate.valueReference && predicate.valueReference.value && 
        predicate.name && predicate.valueReference.value !== predicate.name) {
      // Only warn if valueReference.name doesn't indicate it's for strength/weight
      if (!predicate.valueReference.name || 
          !(predicate.valueReference.name.toLowerCase().includes('strength') || 
            predicate.valueReference.name.toLowerCase().includes('weight') ||
            predicate.valueReference.name.toLowerCase().includes('relation'))) {
        result.warnings.push({
          message: `Predicate name "${predicate.name}" doesn't match valueReference.value "${predicate.valueReference.value}"`
        });
      }
    }
  }
  
  /**
   * Common validations for all content types
   */
  validateCommon(content, result, contentIndex) {
    // Check for ID uniqueness
    if (contentIndex.all && content['@id']) {
      const duplicate = contentIndex.all.find(item => 
        item['@id'] === content['@id'] && 
        JSON.stringify(item) !== JSON.stringify(content)
      );
      
      if (duplicate) {
        result.errors.push({
          message: `Duplicate ID: "${content['@id']}" is used by multiple resources`
        });
        result.valid = false;
      }
    }
    
    // Check for valid dates
    const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
    
    if (content.dateCreated && !datePattern.test(content.dateCreated)) {
      result.errors.push({
        message: `Invalid dateCreated format: "${content.dateCreated}"`
      });
      result.valid = false;
    }
    
    if (content.dateModified && !datePattern.test(content.dateModified)) {
      result.errors.push({
        message: `Invalid dateModified format: "${content.dateModified}"`
      });
      result.valid = false;
    }
    
    // Check that dateModified is not earlier than dateCreated
    if (content.dateCreated && content.dateModified && 
        new Date(content.dateModified) < new Date(content.dateCreated)) {
      result.errors.push({
        message: `dateModified (${content.dateModified}) is earlier than dateCreated (${content.dateCreated})`
      });
      result.valid = false;
    }
    
    // Check for math expression validity (basic syntax check)
    if (content.mathExpression && Array.isArray(content.mathExpression)) {
      content.mathExpression.forEach((expr, index) => {
        // Check for unbalanced curly braces, excluding escaped braces
        let count = 0;
        const reduced = expr.replace(/\\{|\\}/g, '');
        for (const char of reduced) {
          if (char === '{') count++;
          if (char === '}') count--;
          if (count < 0) break;
        }
        
        if (count !== 0) {
          result.warnings.push({
            message: `mathExpression[${index}] has unbalanced curly braces: "${expr}"`
          });
        }
      });
    }
  }
  
  /**
   * Check if a resource ID exists in the content index
   */
  isValidResourceId(id, type = null, contentIndex = {}) {
    // If no content index is available, we can't validate this
    if (!contentIndex.all) return true;
    
    const item = contentIndex.all.find(item => item['@id'] === id);
    if (!item) return false;
    
    // If type is specified, check that the found item matches the expected type
    if (type) {
      if (type === 'concept' && item['@type'] !== 'DefinedTerm') return false;
      if (type === 'resource' && item['@type'] !== 'CreativeWork') return false;
      if (type === 'topic' && 
          (item['@type'] !== 'CreativeWork' || item.learningResourceType !== 'Topic')) return false;
      if (type === 'predicate' && item['@type'] !== 'PropertyValue') return false;
    }
    
    return true;
  }

  /**
   * Build a content index for cross-reference validation
   */
  async buildContentIndex(directory, options = {}) {
    const { recursive = true, filter = /\.json$/ } = options;
    
    const allContent = [];
    const concepts = [];
    const resources = [];
    const topics = [];
    const predicates = [];
    
    async function processDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && recursive) {
            await processDirectory.call(this, entryPath);
          } else if (entry.isFile() && filter.test(entry.name)) {
            try {
              const content = await fs.readFile(entryPath, 'utf8');
              const json = JSON.parse(content);
              
              if (json['@id']) {
                allContent.push(json);
                
                // Categorize by type
                if (json['@type'] === 'DefinedTerm') {
                  concepts.push(json);
                } else if (json['@type'] === 'PropertyValue') {
                  predicates.push(json);
                } else if (json['@type'] === 'CreativeWork') {
                  if (json.learningResourceType === 'Topic') {
                    topics.push(json);
                  } else {
                    resources.push(json);
                  }
                }
              }
            } catch (error) {
              // Skip invalid JSON files for indexing
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    }
    
    await processDirectory.call(this, directory);
    
    return {
      all: allContent,
      concepts,
      resources,
      topics,
      predicates
    };
  }

  /**
   * Validate a file
   */
  async validateFile(filePath, schemaType = null, contentIndex = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(content);
      
      const result = this.validate(json, schemaType, contentIndex);
      return {
        ...result,
        filePath
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message }],
        filePath,
        warnings: []
      };
    }
  }

  /**
   * Validate a directory of files
   */
  async validateDirectory(directory, options = {}) {
    const { recursive = true, filter = /\.json$/ } = options;
    
    // First build an index of all content for cross-reference validation
    const contentIndex = await this.buildContentIndex(directory, options);
    
    const results = {
      valid: true,
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      fileResults: [],
      warningCount: 0
    };
    
    async function processDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && recursive) {
          await processDirectory.call(this, entryPath);
        } else if (entry.isFile() && filter.test(entry.name)) {
          results.totalFiles++;
          
          const fileResult = await this.validateFile(entryPath, null, contentIndex);
          results.fileResults.push(fileResult);
          
          if (fileResult.valid) {
            results.validFiles++;
            
            // Count warnings
            if (fileResult.warnings && fileResult.warnings.length > 0) {
              results.warningCount += fileResult.warnings.length;
            }
          } else {
            results.invalidFiles++;
            results.valid = false;
          }
        }
      }
    }
    
    await processDirectory.call(this, directory);
    return results;
  }
}

module.exports = { SchemaValidator };
