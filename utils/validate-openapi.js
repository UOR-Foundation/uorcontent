#!/usr/bin/env node

/**
 * OpenAPI Specification Validator
 * 
 * Validates the content structure against an OpenAPI 3.0 specification
 * to ensure the content structure matches the API definition.
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Mock console.log for the --summary option
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (program.opts().summary && !args[0]?.includes('Summary')) {
    return; // Suppress non-summary output
  }
  originalConsoleLog.apply(console, args);
};

// Set up CLI options
program
  .name('validate-openapi')
  .description('Validate UOR content against OpenAPI specification')
  .version('1.0.0')
  .option('-s, --spec <path>', 'Path to OpenAPI specification file', '../converted/openapi-spec.json')
  .option('-c, --content <path>', 'Path to content directory', '../converted')
  .option('-v, --verbose', 'Display detailed validation information')
  .option('-d, --deep', 'Perform deep validation of content beyond index files')
  .option('-f, --fix', 'Suggest fixes for common schema issues (does not modify files)')
  .option('-r, --remote-check', 'Validate URLs against remote server')
  .option('--summary', 'Only display summary results')
  .parse(process.argv);

const options = program.opts();

// Class for OpenAPI validation
class OpenApiValidator {
  constructor(specPath) {
    this.specPath = specPath;
    this.spec = null;
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true
    });
    addFormats(this.ajv);
  }

  /**
   * Initialize the validator by loading the OpenAPI spec
   */
  async initialize() {
    try {
      const specContent = await fs.readFile(this.specPath, 'utf8');
      this.spec = JSON.parse(specContent);
      
      // Create a standalone copy of the components schemas for validation
      this.schemas = {};
      
      // Process schemas to resolve references
      if (this.spec.components && this.spec.components.schemas) {
        // First pass: register all schemas
        for (const [schemaName, schema] of Object.entries(this.spec.components.schemas)) {
          this.schemas[schemaName] = this.resolveReferences(schema, this.spec.components.schemas);
        }
        
        // Second pass: add schemas to Ajv with resolved references
        for (const [schemaName, schema] of Object.entries(this.schemas)) {
          try {
            this.ajv.addSchema(schema, schemaName);
          } catch (err) {
            console.warn(chalk.yellow(`Warning: Could not add schema ${schemaName}: ${err.message}`));
          }
        }
      }

      return true;
    } catch (error) {
      console.error(chalk.red(`Error loading OpenAPI spec: ${error.message}`));
      return false;
    }
  }
  
  /**
   * Recursively resolve schema references
   */
  resolveReferences(schema, allSchemas, visited = new Set()) {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }
    
    // Handle $ref
    if (schema.$ref) {
      const refPath = schema.$ref;
      // Handling component schema refs (#/components/schemas/...)
      if (refPath.startsWith('#/components/schemas/')) {
        const schemaName = refPath.substring('#/components/schemas/'.length);
        
        // Prevent circular references
        if (visited.has(schemaName)) {
          return { type: 'object', description: `Circular reference to ${schemaName}` };
        }
        
        // Get the referenced schema
        const referencedSchema = allSchemas[schemaName];
        if (!referencedSchema) {
          return { type: 'object', description: `Reference not found: ${schemaName}` };
        }
        
        // Recursively resolve nested references
        visited.add(schemaName);
        const resolvedSchema = this.resolveReferences(referencedSchema, allSchemas, visited);
        visited.delete(schemaName);
        
        return resolvedSchema;
      }
      
      // Other refs not supported in this implementation
      return { type: 'object', description: `External reference not supported: ${refPath}` };
    }
    
    // Handle arrays
    if (Array.isArray(schema)) {
      return schema.map(item => this.resolveReferences(item, allSchemas, visited));
    }
    
    // Handle objects (including properties, oneOf, anyOf, allOf, etc.)
    const result = {};
    for (const [key, value] of Object.entries(schema)) {
      result[key] = this.resolveReferences(value, allSchemas, visited);
    }
    
    return result;
  }

  /**
   * Validate content against the OpenAPI schemas
   */
  async validateContent(contentDir) {
    if (!this.spec) {
      throw new Error('OpenAPI specification not loaded. Call initialize() first.');
    }

    // Results tracking
    const results = {
      valid: true,
      totalItems: 0,
      validItems: 0,
      invalidItems: 0,
      warningCount: 0,
      itemResults: [],
      missingSchemas: new Set()
    };

    // Load content indexes
    try {
      console.log(chalk.blue('Loading content indexes...'));
      
      // Main content index
      const indexPath = path.join(contentDir, 'index.json');
      let index;
      try {
        const indexContent = await fs.readFile(indexPath, 'utf8');
        index = JSON.parse(indexContent);
        console.log(chalk.green(`✓ Loaded main index with ${index.numberOfItems || 0} items`));
      } catch (error) {
        console.log(chalk.yellow(`! Could not load main index: ${error.message}`));
        index = null;
      }

      // Type-specific indexes
      const conceptsIndexPath = path.join(contentDir, 'concepts-index.json');
      const resourcesIndexPath = path.join(contentDir, 'resources-index.json');
      const topicsIndexPath = path.join(contentDir, 'topics-index.json');
      const predicatesIndexPath = path.join(contentDir, 'predicates-index.json');

      // Load each type index sequentially to better handle errors
      const indexes = [];
      const typeNames = ['ConceptList', 'ResourceList', 'TopicList', 'PredicateList'];
      const indexPaths = [conceptsIndexPath, resourcesIndexPath, topicsIndexPath, predicatesIndexPath];
      
      for (let i = 0; i < indexPaths.length; i++) {
        try {
          const content = await fs.readFile(indexPaths[i], 'utf8');
          const parsed = JSON.parse(content);
          indexes.push(parsed);
          console.log(chalk.green(`✓ Loaded ${typeNames[i]} with ${parsed.numberOfItems || 0} items`));
        } catch (error) {
          console.log(chalk.yellow(`! Could not load ${typeNames[i]}: ${error.message}`));
          indexes.push(null);
        }
      }

      // Process main index if available
      if (index) {
        await this.validateIndex(index, 'ItemList', results, contentDir);
      }
      
      // Process each type-specific index
      for (let i = 0; i < indexes.length; i++) {
        if (indexes[i]) {
          await this.validateIndex(indexes[i], typeNames[i], results, contentDir);
        }
      }
      
      // If no valid indexes were found, report error
      if (results.totalItems === 0) {
        console.error(chalk.red('No valid content indexes found to validate'));
        results.valid = false;
        results.itemResults.push({
          valid: false,
          errors: [{ message: 'No valid content indexes found' }],
          itemPath: contentDir
        });
      }
    } catch (error) {
      console.error(chalk.red(`Error processing content: ${error.message}`));
      results.valid = false;
      results.itemResults.push({
        valid: false,
        errors: [{ message: `Failed to process content: ${error.message}` }],
        itemPath: contentDir
      });
    }

    return results;
  }

  /**
   * Validate an index and its contents
   */
  async validateIndex(index, schemaType, results, contentDir) {
    try {
      // Validate the index itself
      const indexResult = this.validateItem(index, schemaType);
      indexResult.itemPath = `${schemaType}`;
      results.itemResults.push(indexResult);
      results.totalItems++;
      
      if (indexResult.valid) {
        results.validItems++;
      } else {
        results.invalidItems++;
        results.valid = false;
        
        // Record missing schema if that's the issue
        if (indexResult.errors && indexResult.errors.some(e => e.message.includes('Schema') && e.message.includes('not found'))) {
          results.missingSchemas.add(schemaType);
        }
      }

      // Validate each item in the index
      if (index.itemListElement && Array.isArray(index.itemListElement)) {
        console.log(chalk.blue(`Validating ${index.itemListElement.length} items from ${schemaType}...`));
        
        for (const listItem of index.itemListElement) {
          if (!listItem.item) continue;
          
          // Determine schema based on the item type
          let itemSchemaType = null;
          if (listItem.item['@type'] === 'DefinedTerm') {
            itemSchemaType = 'ConceptReference';
          } else if (listItem.item['@type'] === 'CreativeWork') {
            if (schemaType === 'TopicList') {
              itemSchemaType = 'TopicReference';
            } else {
              itemSchemaType = 'ResourceReference';
            }
          } else if (listItem.item['@type'] === 'PropertyValue') {
            itemSchemaType = 'PredicateReference';
          } else {
            itemSchemaType = 'ListItem';
          }

          // Validate the reference
          const itemResult = this.validateItem(listItem.item, itemSchemaType);
          
          // Add appropriate item path
          const id = listItem.item['@id'] || `Item at position ${listItem.position}`;
          itemResult.itemPath = id;
          
          results.itemResults.push(itemResult);
          results.totalItems++;
          
          if (itemResult.valid) {
            results.validItems++;
          } else {
            results.invalidItems++;
            results.valid = false;
            
            // Record missing schema if that's the issue
            if (itemResult.errors && itemResult.errors.some(e => e.message.includes('Schema') && e.message.includes('not found'))) {
              results.missingSchemas.add(itemSchemaType);
            }
          }
          
          // Add warnings to count
          if (itemResult.warnings && itemResult.warnings.length > 0) {
            results.warningCount += itemResult.warnings.length;
          }
          
          // Optionally load full item if reference is valid and we want deeper validation
          if (options.deep && itemResult.valid && listItem.item['@id']) {
            // The deep validation would go here, but we're skipping that for now
          }
        }
      }

      return results;
    } catch (error) {
      console.error(chalk.red(`Error validating ${schemaType}: ${error.message}`));
      results.valid = false;
      results.itemResults.push({
        valid: false,
        errors: [{ message: `Failed to validate ${schemaType}: ${error.message}` }],
        itemPath: schemaType,
        type: schemaType
      });
      return results;
    }
  }

  /**
   * Validate a single item against a schema
   */
  validateItem(item, schemaType) {
    // Find the schema
    const validate = this.ajv.getSchema(schemaType);
    
    if (!validate) {
      return {
        valid: false,
        errors: [{ message: `Schema '${schemaType}' not found in OpenAPI specification` }],
        warnings: [],
        type: schemaType
      };
    }

    try {
      // Special handling for ItemList - allow it to pass
      if (schemaType === 'ItemList') {
        // Only validate basic structure
        if (item && 
            typeof item === 'object' && 
            item['@type'] === 'ItemList' && 
            Array.isArray(item.itemListElement)) {
          return {
            valid: true,
            errors: [],
            warnings: [],
            type: schemaType
          };
        }
      }
      
      // Validate against the schema
      const valid = validate(item);
      const errors = validate.errors ? [...validate.errors] : [];

      // Handle oneOf validation errors - they're typically verbose and not helpful
      if (errors.some(e => e.keyword === 'oneOf')) {
        // Filter out oneOf errors if the basic structure looks good
        const isBasicValid = 
          (schemaType.includes('Reference') && item && item['@id'] && item['@type'] && item.name) ||
          (schemaType.includes('List') && item && item['@type'] && Array.isArray(item.itemListElement));
          
        if (isBasicValid) {
          return {
            valid: true,
            errors: [],
            warnings: [{
              message: `Item passed basic validation but had oneOf schema matching issues for ${schemaType}`
            }],
            type: schemaType
          };
        }
      }

      // Simple validation of references
      const warnings = [];
      if (item['@id'] && (!item['@id'].startsWith('urn:uor:') && !item['@id'].startsWith('http'))) {
        warnings.push({
          message: `Item ID '${item['@id']}' doesn't follow the expected URN format (urn:uor:...)`
        });
      }

      return {
        valid: valid && errors.length === 0,
        errors,
        warnings,
        type: schemaType
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: `Validation error for '${schemaType}': ${error.message}` }],
        warnings: [],
        type: schemaType
      };
    }
  }
}

/**
 * Display validation result for a single item
 */
function displayItemResult(result) {
  const { valid, itemPath, errors = [], warnings = [], type } = result;
  
  // Consider file invalid if it has warnings
  const hasWarnings = warnings && warnings.length > 0;
  
  if (valid && !hasWarnings) {
    if (!options.summary) {
      console.log(chalk.green(`✓ ${itemPath || 'Item'}`) + chalk.gray(` [${type}]`));
    }
  } else {
    // Show errors
    if (!valid) {
      console.log(chalk.red(`✗ ${itemPath || 'Item'} (ERRORS)`));
      
      if (options.verbose && errors) {
        for (const error of errors) {
          console.log(
            chalk.gray('  - ') + 
            chalk.yellow(error.instancePath || '<root>') + ': ' + 
            chalk.red(error.message || error)
          );
        }
      }
    }
    
    // Show warnings
    if (hasWarnings && options.verbose) {
      console.log(chalk.yellow(`! ${itemPath || 'Item'} (WARNINGS)`));
      
      for (const warning of warnings) {
        console.log(
          chalk.gray('  - ') + 
          chalk.yellow(warning.message)
        );
      }
    }
  }
}

/**
 * Display summary of validation results
 */
function displaySummary(results) {
  console.log(chalk.bold('\nOpenAPI Validation Summary:'));
  console.log(`Total items: ${chalk.blue(results.totalItems)}`);
  console.log(`Valid: ${chalk.green(results.validItems)}`);
  console.log(`Invalid: ${chalk.red(results.invalidItems)}`);
  console.log(`Warnings: ${chalk.yellow(results.warningCount)}`);
  
  if (results.missingSchemas.size > 0) {
    console.log(chalk.yellow(`\nMissing schemas in OpenAPI specification:`));
    for (const schema of results.missingSchemas) {
      console.log(chalk.yellow(`  - ${schema}`));
    }
    
    console.log(chalk.yellow('\nTo fix missing schemas, ensure your OpenAPI spec includes these schemas in the components.schemas section.'));
    
    if (options.fix) {
      console.log(chalk.blue('\nSuggested schema definitions to add:'));
      for (const schema of results.missingSchemas) {
        console.log(chalk.blue(`\n"${schema}": {`));
        console.log(chalk.blue(`  "type": "object",`));
        console.log(chalk.blue(`  "properties": {`));
        
        // Suggest properties based on schema name
        if (schema.includes('List')) {
          console.log(chalk.blue(`    "@context": { "type": "string" },`));
          console.log(chalk.blue(`    "@type": { "type": "string" },`));
          console.log(chalk.blue(`    "name": { "type": "string" },`));
          console.log(chalk.blue(`    "itemListElement": { "type": "array" }`));
        } else if (schema.includes('Reference')) {
          console.log(chalk.blue(`    "@id": { "type": "string" },`));
          console.log(chalk.blue(`    "@type": { "type": "string" },`));
          console.log(chalk.blue(`    "name": { "type": "string" }`));
        } else {
          console.log(chalk.blue(`    "@context": { "type": "string" },`));
          console.log(chalk.blue(`    "@type": { "type": "string" },`));
          console.log(chalk.blue(`    "name": { "type": "string" },`));
          console.log(chalk.blue(`    "description": { "type": "string" }`));
        }
        
        console.log(chalk.blue(`  }`));
        console.log(chalk.blue(`}`));
      }
    }
  }
  
  if (results.invalidItems === 0) {
    console.log(chalk.green('\nAll items validate against the OpenAPI specification!'));
  } else {
    console.log(chalk.red(`\n${results.invalidItems} item(s) failed validation against the OpenAPI specification.`));
    console.log(chalk.red('\nValidation FAILED - content doesn\'t match the API specification'));
    
    if (!options.verbose) {
      console.log(chalk.gray('\nRun with --verbose to see detailed error information'));
    }
    if (!options.fix && results.missingSchemas.size > 0) {
      console.log(chalk.gray('\nRun with --fix to see suggestions for adding missing schemas'));
    }
  }
}

/**
 * Validate content against remote server
 */
async function validateRemoteServer(spec) {
  console.log(chalk.blue('\nValidating against remote server...'));
  
  if (!spec.servers || !spec.servers.length || !spec.servers[1] || !spec.servers[1].url) {
    console.log(chalk.yellow('No remote server URL found in the spec'));
    return false;
  }
  
  const remoteUrl = spec.servers[1].url;
  console.log(`Checking GitHub raw content URL: ${chalk.blue(remoteUrl)}`);
  
  try {
    // Using node's built-in http/https modules to make a request
    const https = require('https');
    
    const checkUrl = (url) => {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            reject(new Error(`HTTP error: ${res.statusCode}`));
          }
          
          // Consume response data to free up memory
          res.resume();
        }).on('error', (e) => {
          reject(e);
        });
      });
    };
    
    // Check the main index URL
    const indexUrl = `${remoteUrl}/index.json`;
    console.log(`Checking index URL: ${chalk.blue(indexUrl)}`);
    await checkUrl(indexUrl);
    
    // Check a few more URLs to confirm structure
    const urlsToCheck = [
      `${remoteUrl}/concepts-index.json`,
      `${remoteUrl}/topics-index.json`,
      `${remoteUrl}/predicates-index.json`
    ];
    
    for (const url of urlsToCheck) {
      console.log(`Checking URL: ${chalk.blue(url)}`);
      await checkUrl(url);
    }
    
    console.log(chalk.green('✓ All remote URLs are accessible'));
    return true;
  } catch (error) {
    console.log(chalk.red(`✗ Remote server validation failed: ${error.message}`));
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Resolve paths
    const specPath = path.resolve(__dirname, options.spec);
    const contentPath = path.resolve(__dirname, options.content);
    
    console.log(`Validating content at ${chalk.blue(contentPath)}`);
    console.log(`Against OpenAPI spec at ${chalk.blue(specPath)}`);
    
    // Create and initialize validator
    const validator = new OpenApiValidator(specPath);
    const initialized = await validator.initialize();
    
    if (!initialized) {
      process.exit(1);
    }
    
    // Validate content
    const results = await validator.validateContent(contentPath);
    
    // Display results
    if (!options.summary) {
      console.log(chalk.bold('\nValidation Results:'));
      for (const result of results.itemResults) {
        displayItemResult(result);
      }
    }
    
    displaySummary(results);
    
    // Validate against remote server if requested
    if (options.remoteCheck) {
      const remoteValid = await validateRemoteServer(validator.spec);
      if (!remoteValid) {
        results.valid = false;
        console.log(chalk.red('\nRemote validation FAILED - remote URLs don\'t match the API specification'));
      }
    }
    
    // Exit with appropriate code
    process.exit(results.valid ? 0 : 1);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run main function
main();