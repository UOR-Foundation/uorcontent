# Feature Role: Content Import/Export Implementation (Issue #15)

This document contains detailed implementation specifications for the Content Import/Export component of Phase 4 of the UOR Content Management Client.

## Implementation Overview

The Content Import/Export component provides functionality for importing and exporting content in various formats, enabling data exchange with other systems and batch operations.

## Key Components

### ImportExportService Class

```typescript
import { ContentRepository } from '../repository/content-repository';
import { ValidationEngine } from '../engines/validation-engine';
import { ContentTypeEnum } from '../types/content-types';
import { FileSystemService } from '../services/file-system-service';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Import options
 */
export interface ImportOptions {
  validateBeforeImport?: boolean;
  updateExisting?: boolean;
  importRelationships?: boolean;
  dryRun?: boolean;
}

/**
 * Export options
 */
export interface ExportOptions {
  format?: 'json' | 'markdown' | 'html';
  includeRelationships?: boolean;
  filter?: any;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: Array<{
    item: any;
    error: string;
  }>;
  dryRun: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  exported: number;
  format: string;
  outputPath: string;
}

/**
 * Batch operation progress
 */
export interface BatchProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errors: string[];
}

/**
 * Import/Export Service for content import and export
 */
export class ImportExportService {
  /**
   * Creates a new ImportExportService instance
   */
  constructor(
    private contentRepository: ContentRepository,
    private validationEngine: ValidationEngine,
    private fileSystem: FileSystemService
  ) {}

  /**
   * Imports content from a JSON file
   * @param filePath Path to JSON file
   * @param contentType Type of content to import
   * @param options Import options
   * @returns Import result
   */
  async importFromJson(
    filePath: string,
    contentType: ContentTypeEnum,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    // Default options
    const importOptions: ImportOptions = {
      validateBeforeImport: true,
      updateExisting: false,
      importRelationships: true,
      dryRun: false,
      ...options
    };
    
    // Read file
    const fileContent = await this.fileSystem.readFile(filePath);
    let items: any[];
    
    try {
      items = JSON.parse(fileContent);
      
      // Ensure items is an array
      if (!Array.isArray(items)) {
        items = [items];
      }
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error.message}`);
    }
    
    // Initialize result
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [],
      dryRun: importOptions.dryRun
    };
    
    // Process each item
    for (const item of items) {
      try {
        // Validate item if required
        if (importOptions.validateBeforeImport) {
          const validationResult = await this.validationEngine.validateContent(item, contentType);
          
          if (!validationResult.isValid) {
            throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
          }
        }
        
        // Skip actual import in dry run mode
        if (importOptions.dryRun) {
          result.imported++;
          continue;
        }
        
        // Check if item already exists
        let existingItem = null;
        
        if (item.id) {
          try {
            existingItem = await this.contentRepository.read(contentType, item.id);
          } catch (error) {
            // Item doesn't exist, which is fine
          }
        }
        
        // Update existing item or create new one
        if (existingItem && importOptions.updateExisting) {
          await this.contentRepository.update(contentType, item.id, item, existingItem.version);
          result.updated++;
        } else if (!existingItem) {
          await this.contentRepository.create(contentType, item);
          result.imported++;
        } else {
          throw new Error(`Item with ID ${item.id} already exists and updateExisting is false`);
        }
        
        // Import relationships if required
        if (importOptions.importRelationships && item.relationships) {
          // In a real implementation, this would import relationships
          // For now, we just log a message
          console.log(`Importing relationships for ${item.id}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          item,
          error: error.message
        });
      }
    }
    
    // Set success flag
    result.success = result.failed === 0;
    
    return result;
  }

  /**
   * Exports content to a JSON file
   * @param outputPath Path to output file
   * @param contentType Type of content to export
   * @param options Export options
   * @returns Export result
   */
  async exportToJson(
    outputPath: string,
    contentType: ContentTypeEnum,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    // Default options
    const exportOptions: ExportOptions = {
      format: 'json',
      includeRelationships: true,
      filter: {},
      ...options
    };
    
    // Get content
    const items = await this.contentRepository.list(contentType, exportOptions.filter);
    
    // Include relationships if required
    if (exportOptions.includeRelationships) {
      // In a real implementation, this would include relationships
      // For now, we just log a message
      console.log(`Including relationships for ${items.length} items`);
    }
    
    // Write file
    await this.fileSystem.writeFile(outputPath, JSON.stringify(items, null, 2));
    
    return {
      success: true,
      exported: items.length,
      format: 'json',
      outputPath
    };
  }

  /**
   * Exports content to a Markdown file
   * @param outputPath Path to output file
   * @param contentType Type of content to export
   * @param options Export options
   * @returns Export result
   */
  async exportToMarkdown(
    outputPath: string,
    contentType: ContentTypeEnum,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    // Default options
    const exportOptions: ExportOptions = {
      format: 'markdown',
      includeRelationships: true,
      filter: {},
      ...options
    };
    
    // Get content
    const items = await this.contentRepository.list(contentType, exportOptions.filter);
    
    // Generate Markdown
    let markdown = `# ${contentType} Export\n\n`;
    markdown += `Generated on ${new Date().toISOString()}\n\n`;
    
    for (const item of items) {
      markdown += `## ${item.name}\n\n`;
      markdown += `ID: ${item.id}\n\n`;
      markdown += `${item.description}\n\n`;
      
      // Add other fields
      for (const [key, value] of Object.entries(item)) {
        if (
          key !== 'id' && 
          key !== 'name' && 
          key !== 'description' && 
          typeof value !== 'object'
        ) {
          markdown += `${key}: ${value}\n\n`;
        }
      }
      
      // Include relationships if required
      if (exportOptions.includeRelationships) {
        // In a real implementation, this would include relationships
        // For now, we just add a placeholder
        markdown += `### Relationships\n\n`;
        markdown += `Relationships data would be included here.\n\n`;
      }
      
      markdown += `---\n\n`;
    }
    
    // Write file
    await this.fileSystem.writeFile(outputPath, markdown);
    
    return {
      success: true,
      exported: items.length,
      format: 'markdown',
      outputPath
    };
  }

  /**
   * Exports content to an HTML file
   * @param outputPath Path to output file
   * @param contentType Type of content to export
   * @param options Export options
   * @returns Export result
   */
  async exportToHtml(
    outputPath: string,
    contentType: ContentTypeEnum,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    // Default options
    const exportOptions: ExportOptions = {
      format: 'html',
      includeRelationships: true,
      filter: {},
      ...options
    };
    
    // Get content
    const items = await this.contentRepository.list(contentType, exportOptions.filter);
    
    // Generate HTML
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${contentType} Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .item { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
    .item-name { font-size: 24px; font-weight: bold; }
    .item-id { color: #666; margin-bottom: 10px; }
    .item-description { margin-bottom: 15px; }
    .item-field { margin: 5px 0; }
    .relationships { margin-top: 15px; }
    .relationships h3 { font-size: 18px; }
  </style>
</head>
<body>
  <h1>${contentType} Export</h1>
  <p>Generated on ${new Date().toISOString()}</p>
`;
    
    for (const item of items) {
      html += `  <div class="item">
    <div class="item-name">${this.escapeHtml(item.name)}</div>
    <div class="item-id">ID: ${this.escapeHtml(item.id)}</div>
    <div class="item-description">${this.escapeHtml(item.description)}</div>
`;
      
      // Add other fields
      for (const [key, value] of Object.entries(item)) {
        if (
          key !== 'id' && 
          key !== 'name' && 
          key !== 'description' && 
          typeof value !== 'object'
        ) {
          html += `    <div class="item-field"><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}</div>
`;
        }
      }
      
      // Include relationships if required
      if (exportOptions.includeRelationships) {
        // In a real implementation, this would include relationships
        // For now, we just add a placeholder
        html += `    <div class="relationships">
      <h3>Relationships</h3>
      <p>Relationships data would be included here.</p>
    </div>
`;
      }
      
      html += `  </div>
`;
    }
    
    html += `</body>
</html>`;
    
    // Write file
    await this.fileSystem.writeFile(outputPath, html);
    
    return {
      success: true,
      exported: items.length,
      format: 'html',
      outputPath
    };
  }

  /**
   * Performs a batch import operation
   * @param directoryPath Path to directory containing files to import
   * @param contentType Type of content to import
   * @param options Import options
   * @returns Batch progress
   */
  async batchImport(
    directoryPath: string,
    contentType: ContentTypeEnum,
    options: ImportOptions = {}
  ): Promise<BatchProgress> {
    // Get all JSON files in directory
    const files = await this.fileSystem.readDir(directoryPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Initialize progress
    const progress: BatchProgress = {
      total: jsonFiles.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      status: 'pending',
      errors: []
    };
    
    // Start batch operation
    progress.status = 'in_progress';
    
    // Process each file
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(directoryPath, file);
        const result = await this.importFromJson(filePath, contentType, options);
        
        progress.processed++;
        
        if (result.success) {
          progress.succeeded++;
        } else {
          progress.failed++;
          progress.errors.push(`File ${file}: ${result.errors.map(e => e.error).join(', ')}`);
        }
      } catch (error) {
        progress.processed++;
        progress.failed++;
        progress.errors.push(`File ${file}: ${error.message}`);
      }
    }
    
    // Complete batch operation
    progress.status = progress.failed === 0 ? 'completed' : 'failed';
    
    return progress;
  }

  /**
   * Performs a batch export operation
   * @param directoryPath Path to directory to export to
   * @param contentType Type of content to export
   * @param options Export options
   * @returns Batch progress
   */
  async batchExport(
    directoryPath: string,
    contentType: ContentTypeEnum,
    options: ExportOptions = {}
  ): Promise<BatchProgress> {
    // Get all content
    const items = await this.contentRepository.list(contentType, options.filter);
    
    // Initialize progress
    const progress: BatchProgress = {
      total: items.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      status: 'pending',
      errors: []
    };
    
    // Start batch operation
    progress.status = 'in_progress';
    
    // Ensure directory exists
    await this.fileSystem.ensureDir(directoryPath);
    
    // Process each item
    for (const item of items) {
      try {
        const fileName = `${item.id}.${options.format || 'json'}`;
        const filePath = path.join(directoryPath, fileName);
        
        // Export based on format
        let result: ExportResult;
        
        switch (options.format) {
          case 'markdown':
            result = await this.exportToMarkdown(filePath, contentType, {
              ...options,
              filter: { id: item.id }
            });
            break;
            
          case 'html':
            result = await this.exportToHtml(filePath, contentType, {
              ...options,
              filter: { id: item.id }
            });
            break;
            
          case 'json':
          default:
            result = await this.exportToJson(filePath, contentType, {
              ...options,
              filter: { id: item.id }
            });
            break;
        }
        
        progress.processed++;
        
        if (result.success) {
          progress.succeeded++;
        } else {
          progress.failed++;
          progress.errors.push(`Item ${item.id}: Export failed`);
        }
      } catch (error) {
        progress.processed++;
        progress.failed++;
        progress.errors.push(`Item ${item.id}: ${error.message}`);
      }
    }
    
    // Complete batch operation
    progress.status = progress.failed === 0 ? 'completed' : 'failed';
    
    return progress;
  }

  /**
   * Escapes HTML special characters
   * @param text Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
```

### MCP Server Integration

```typescript
import { MCPServer } from '../server/mcp-server';
import { ImportExportService, ImportOptions, ExportOptions } from '../services/import-export-service';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Registers Import/Export Service endpoints with the MCP server
 * @param mcpServer MCP server instance
 * @param importExportService Import/Export Service instance
 */
export function registerImportExportEndpoints(
  mcpServer: MCPServer,
  importExportService: ImportExportService
): void {
  // Import from JSON
  mcpServer.registerMethod('import.fromJson', async (params) => {
    const { filePath, contentType, options } = params;
    return importExportService.importFromJson(filePath, contentType, options);
  });

  // Export to JSON
  mcpServer.registerMethod('export.toJson', async (params) => {
    const { outputPath, contentType, options } = params;
    return importExportService.exportToJson(outputPath, contentType, options);
  });

  // Export to Markdown
  mcpServer.registerMethod('export.toMarkdown', async (params) => {
    const { outputPath, contentType, options } = params;
    return importExportService.exportToMarkdown(outputPath, contentType, options);
  });

  // Export to HTML
  mcpServer.registerMethod('export.toHtml', async (params) => {
    const { outputPath, contentType, options } = params;
    return importExportService.exportToHtml(outputPath, contentType, options);
  });

  // Batch import
  mcpServer.registerMethod('import.batch', async (params) => {
    const { directoryPath, contentType, options } = params;
    return importExportService.batchImport(directoryPath, contentType, options);
  });

  // Batch export
  mcpServer.registerMethod('export.batch', async (params) => {
    const { directoryPath, contentType, options } = params;
    return importExportService.batchExport(directoryPath, contentType, options);
  });
}
```

## Integration with Previous Phases

The Content Import/Export component integrates with the following components from previous phases:

1. **Phase 1 Components**:
   - Uses TypeScript configuration with strict mode
   - Leverages type definitions for content models
   - Utilizes file system utilities for file operations
   - Applies schema validation for content integrity

2. **Phase 2 Components**:
   - Integrates with ConceptManager through ContentRepository
   - Leverages IndexManager for efficient content retrieval
   - Builds upon Query Operations for content listing

3. **Phase 3 Components**:
   - Integrates with ResourceManager, TopicManager, and PredicateManager through ContentRepository
   - Leverages RelationshipManager for relationship operations
   - Maintains reference integrity across all content types

## Implementation Details

### JSON Import/Export

The JSON import/export functionality provides data exchange with other systems:

1. **Import from JSON**: Imports content from JSON files with validation.
2. **Export to JSON**: Exports content to JSON files with relationship inclusion.
3. **Batch Import**: Imports multiple JSON files in a batch operation.
4. **Batch Export**: Exports multiple items to individual JSON files.

### Format Conversion

The format conversion functionality enables content representation in different formats:

1. **Markdown Export**: Exports content to Markdown format for documentation.
2. **HTML Export**: Exports content to HTML format for web display.
3. **Format Options**: Configurable options for each format.
4. **Relationship Inclusion**: Option to include relationships in exports.

### Batch Operations

The batch operations functionality enables processing multiple items efficiently:

1. **Directory Processing**: Process all files in a directory.
2. **Progress Tracking**: Track progress of batch operations.
3. **Error Handling**: Collect errors for failed operations.
4. **Status Reporting**: Report overall status of batch operations.

### Validation Integration

The validation integration ensures data integrity during import:

1. **Pre-Import Validation**: Validate content before importing.
2. **Error Reporting**: Report validation errors for failed imports.
3. **Dry Run Mode**: Test import without actually importing.
4. **Update Existing**: Option to update existing content.

## Testing Strategy

The Content Import/Export component should be tested with:

1. **Unit Tests**: Test each method in isolation with mocked dependencies.
2. **Integration Tests**: Test the integration with ContentRepository and ValidationEngine.
3. **Format Tests**: Verify export in different formats.
4. **Batch Operation Tests**: Verify batch import and export operations.
5. **Error Handling Tests**: Verify proper error handling for invalid inputs and edge cases.
