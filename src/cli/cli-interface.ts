/**
 * CLI Interface
 * Implements Issue #16
 */

import { Command } from 'commander';
import { ContentRepository } from '../repository/content-repository';
import { QueryEngine } from '../query/query-engine';
import { ValidationEngine } from '../validation/validation-engine';
import { ImportExportService } from '../import-export/import-export-service';
import { ContentType, ContentItem, ValidationOptions, ImportOptions, ExportOptions } from '../types';
import { UORContentItem } from '../models/types';
import * as readline from 'readline';
import * as fs from 'fs';

/**
 * CLI Interface
 * Provides command-line access to all functionality
 */
export class CLIInterface {
  private program: Command;
  private repository: ContentRepository;
  private queryEngine: QueryEngine;
  private validationEngine: ValidationEngine;
  private importExportService: ImportExportService;
  private interactive: boolean;
  private rl: readline.Interface | null = null;

  /**
   * Creates a new CLIInterface instance
   * @param repository Content repository instance
   * @param queryEngine Query engine instance
   * @param validationEngine Validation engine instance
   * @param importExportService Import/export service instance
   */
  constructor(
    repository: ContentRepository,
    queryEngine: QueryEngine,
    validationEngine: ValidationEngine,
    importExportService: ImportExportService
  ) {
    this.repository = repository;
    this.queryEngine = queryEngine;
    this.validationEngine = validationEngine;
    this.importExportService = importExportService;
    this.interactive = false;
    this.program = new Command();
    
    this.setupProgram();
  }

  /**
   * Sets up the command-line program
   */
  private setupProgram(): void {
    this.program
      .name('uorcontent')
      .description('UOR Content Management CLI')
      .version('1.0.0');
    
    this.setupContentCommands();
    this.setupQueryCommands();
    this.setupValidationCommands();
    this.setupImportExportCommands();
    this.setupInteractiveMode();
  }

  /**
   * Sets up content management commands
   */
  private setupContentCommands(): void {
    const contentCmd = this.program.command('content');
    
    contentCmd
      .command('create <type>')
      .description('Create a new content item')
      .option('-f, --file <file>', 'JSON file containing content data')
      .option('-d, --data <json>', 'JSON string containing content data')
      .action(async (type: string, options: { file?: string; data?: string }) => {
        try {
          const contentType = this.validateContentType(type);
          const data = await this.getContentData(options);
          
          if (!data) {
            console.error('No content data provided');
            return;
          }
          
          const result = await this.repository.createContent(contentType, data as UORContentItem);
          console.log(`Created ${contentType} with ID: ${result['@id']}`);
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`Error creating content: ${(error as Error).message}`);
        }
      });
    
    contentCmd
      .command('get <type> <id>')
      .description('Get a content item by ID')
      .option('-p, --pretty', 'Pretty print the output')
      .action(async (type: string, id: string, options: { pretty?: boolean }) => {
        try {
          const contentType = this.validateContentType(type);
          const result = await this.repository.readContent(contentType, id);
          
          if (!result) {
            console.error(`${contentType} with ID ${id} not found`);
            return;
          }
          
          if (options.pretty) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(JSON.stringify(result));
          }
        } catch (error) {
          console.error(`Error getting content: ${(error as Error).message}`);
        }
      });
    
    contentCmd
      .command('update <type> <id>')
      .description('Update a content item')
      .option('-f, --file <file>', 'JSON file containing content data')
      .option('-d, --data <json>', 'JSON string containing content data')
      .action(async (type: string, id: string, options: { file?: string; data?: string }) => {
        try {
          const contentType = this.validateContentType(type);
          const data = await this.getContentData(options);
          
          if (!data) {
            console.error('No content data provided');
            return;
          }
          
          const result = await this.repository.updateContent(contentType, id, data as UORContentItem);
          console.log(`Updated ${contentType} with ID: ${id}`);
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`Error updating content: ${(error as Error).message}`);
        }
      });
    
    contentCmd
      .command('delete <type> <id>')
      .description('Delete a content item')
      .option('-f, --force', 'Force deletion without confirmation')
      .action(async (type: string, id: string, options: { force?: boolean }) => {
        try {
          const contentType = this.validateContentType(type);
          
          if (!options.force) {
            const confirmed = await this.confirm(`Are you sure you want to delete ${contentType} with ID ${id}?`);
            
            if (!confirmed) {
              console.log('Deletion cancelled');
              return;
            }
          }
          
          const result = await this.repository.deleteContent(contentType, id);
          
          if (result) {
            console.log(`Deleted ${contentType} with ID: ${id}`);
          } else {
            console.error(`${contentType} with ID ${id} not found`);
          }
        } catch (error) {
          console.error(`Error deleting content: ${(error as Error).message}`);
        }
      });
    
    contentCmd
      .command('list <type>')
      .description('List content items')
      .option('-l, --limit <number>', 'Maximum number of items to return', '100')
      .option('-o, --offset <number>', 'Offset for pagination', '0')
      .option('-f, --filter <json>', 'JSON filter criteria')
      .option('-p, --pretty', 'Pretty print the output')
      .action(async (type: string, options: { limit?: string; offset?: string; filter?: string; pretty?: boolean }) => {
        try {
          const contentType = this.validateContentType(type);
          const limit = options.limit ? parseInt(options.limit, 10) : 100;
          const offset = options.offset ? parseInt(options.offset, 10) : 0;
          const filter = options.filter ? JSON.parse(options.filter) : undefined;
          
          const result = await this.repository.listContent(contentType, { limit, offset, filter });
          
          if (options.pretty) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(JSON.stringify(result));
          }
          
          console.log(`Total: ${result.length} items`);
        } catch (error) {
          console.error(`Error listing content: ${(error as Error).message}`);
        }
      });
    
    contentCmd
      .command('stats')
      .description('Get repository statistics')
      .action(async () => {
        try {
          const stats = await this.repository.getStatistics();
          console.log(JSON.stringify(stats, null, 2));
        } catch (error) {
          console.error(`Error getting statistics: ${(error as Error).message}`);
        }
      });
    
    contentCmd
      .command('health')
      .description('Check repository health')
      .action(async () => {
        try {
          const health = await this.repository.checkHealth();
          console.log(JSON.stringify(health, null, 2));
        } catch (error) {
          console.error(`Error checking health: ${(error as Error).message}`);
        }
      });
  }

  /**
   * Sets up query commands
   */
  private setupQueryCommands(): void {
    const queryCmd = this.program.command('query');
    
    queryCmd
      .command('search')
      .description('Search content')
      .option('-t, --types <types>', 'Comma-separated list of content types')
      .option('-q, --query <text>', 'Full-text query')
      .option('-s, --semantic <text>', 'Semantic query')
      .option('-f, --filter <json>', 'JSON filter criteria')
      .option('-l, --limit <number>', 'Maximum number of items to return', '50')
      .option('-o, --offset <number>', 'Offset for pagination', '0')
      .option('-p, --pretty', 'Pretty print the output')
      .action(async (options: {
        types?: string;
        query?: string;
        semantic?: string;
        filter?: string;
        limit?: string;
        offset?: string;
        pretty?: boolean;
      }) => {
        try {
          const contentTypes = options.types ? options.types.split(',') as ContentType[] : undefined;
          const limit = options.limit ? parseInt(options.limit, 10) : 50;
          const offset = options.offset ? parseInt(options.offset, 10) : 0;
          const filter = options.filter ? JSON.parse(options.filter) : undefined;
          
          const result = await this.queryEngine.query({
            contentTypes,
            fullText: options.query,
            semanticQuery: options.semantic,
            filter,
            limit,
            offset
          });
          
          if (options.pretty) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(JSON.stringify(result));
          }
          
          console.log(`Total: ${result.total} items, showing ${result.items.length}`);
        } catch (error) {
          console.error(`Error searching content: ${(error as Error).message}`);
        }
      });
  }

  /**
   * Sets up validation commands
   */
  private setupValidationCommands(): void {
    const validateCmd = this.program.command('validate');
    
    validateCmd
      .command('item <type>')
      .description('Validate a content item')
      .option('-f, --file <file>', 'JSON file containing content data')
      .option('-d, --data <json>', 'JSON string containing content data')
      .option('-i, --id <id>', 'ID of existing content item to validate')
      .option('-r, --relationships', 'Validate relationships')
      .option('-p, --pretty', 'Pretty print the output')
      .action(async (type: string, options: {
        file?: string;
        data?: string;
        id?: string;
        relationships?: boolean;
        pretty?: boolean;
      }) => {
        try {
          const contentType = this.validateContentType(type);
          let content: ContentItem;
          
          if (options.id) {
            const item = await this.repository.readContent(contentType, options.id);
            
            if (!item) {
              console.error(`${contentType} with ID ${options.id} not found`);
              return;
            }
            
            content = item as unknown as ContentItem;
          } else {
            const data = await this.getContentData(options);
            
            if (!data) {
              console.error('No content data provided');
              return;
            }
            
            content = data;
          }
          
          const validationOptions: ValidationOptions = {
            validateRelationships: options.relationships
          };
          
          const result = await this.validationEngine.validateItem(contentType, content, validationOptions);
          
          if (options.pretty) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(JSON.stringify(result));
          }
          
          if (result.valid) {
            console.log('Validation successful');
          } else {
            console.error(`Validation failed with ${result.errors?.length || 0} errors`);
          }
        } catch (error) {
          console.error(`Error validating content: ${(error as Error).message}`);
        }
      });
    
    validateCmd
      .command('type <type>')
      .description('Validate all content of a specific type')
      .option('-r, --relationships', 'Validate relationships')
      .option('-p, --repair', 'Attempt to repair invalid content')
      .option('-s, --strict', 'Use strict validation mode')
      .option('--pretty', 'Pretty print the output')
      .action(async (type: string, options: {
        relationships?: boolean;
        repair?: boolean;
        strict?: boolean;
        pretty?: boolean;
      }) => {
        try {
          const contentType = this.validateContentType(type);
          
          const validationOptions: ValidationOptions = {
            validateRelationships: options.relationships,
            repairMode: options.repair,
            strictMode: options.strict
          };
          
          const result = await this.validationEngine.validateContentType(contentType, validationOptions);
          
          if (options.pretty) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(JSON.stringify(result));
          }
          
          console.log(`Validation ${result.valid ? 'successful' : 'failed'}`);
          console.log(`Errors: ${result.errors.length}`);
          console.log(`Warnings: ${result.warnings.length}`);
          
          if (result.repaired) {
            console.log(`Repaired: ${result.repaired.length} items`);
          }
        } catch (error) {
          console.error(`Error validating content type: ${(error as Error).message}`);
        }
      });
    
    validateCmd
      .command('repository')
      .description('Validate the entire repository')
      .option('-r, --relationships', 'Validate relationships')
      .option('-p, --repair', 'Attempt to repair invalid content')
      .option('-s, --strict', 'Use strict validation mode')
      .option('--pretty', 'Pretty print the output')
      .action(async (options: {
        relationships?: boolean;
        repair?: boolean;
        strict?: boolean;
        pretty?: boolean;
      }) => {
        try {
          const validationOptions: ValidationOptions = {
            validateRelationships: options.relationships,
            repairMode: options.repair,
            strictMode: options.strict
          };
          
          const result = await this.validationEngine.validateRepository(validationOptions);
          
          if (options.pretty) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(JSON.stringify(result));
          }
          
          console.log(`Validation ${result.valid ? 'successful' : 'failed'}`);
          console.log(`Errors: ${result.errors.length}`);
          console.log(`Warnings: ${result.warnings.length}`);
          
          if (result.repaired) {
            console.log(`Repaired: ${result.repaired.length} items`);
          }
        } catch (error) {
          console.error(`Error validating repository: ${(error as Error).message}`);
        }
      });
  }

  /**
   * Sets up import/export commands
   */
  private setupImportExportCommands(): void {
    const importExportCmd = this.program.command('io');
    
    importExportCmd
      .command('import <file>')
      .description('Import content from a file')
      .option('-v, --validate', 'Validate content before import')
      .option('-u, --update', 'Update existing content')
      .option('-b, --batch <size>', 'Batch size for import', '100')
      .action(async (file: string, options: {
        validate?: boolean;
        update?: boolean;
        batch?: string;
      }) => {
        try {
          const importOptions: ImportOptions = {
            validateBeforeImport: options.validate,
            updateExisting: options.update,
            batchSize: options.batch ? parseInt(options.batch, 10) : 100
          };
          
          const result = await this.importExportService.importFromFile(file, importOptions);
          
          console.log(JSON.stringify(result, null, 2));
          
          if (result.success) {
            console.log(`Import successful: ${result.imported} items imported`);
          } else {
            console.error(`Import failed: ${result.failed} items failed`);
          }
        } catch (error) {
          console.error(`Error importing content: ${(error as Error).message}`);
        }
      });
    
    importExportCmd
      .command('export <file>')
      .description('Export content to a file')
      .option('-t, --types <types>', 'Comma-separated list of content types to export')
      .option('-f, --filter <json>', 'JSON filter criteria')
      .option('-m, --format <format>', 'Export format (json, markdown, html)')
      .action(async (file: string, options: {
        types?: string;
        filter?: string;
        format?: string;
      }) => {
        try {
          const exportOptions: ExportOptions = {
            includeTypes: options.types ? options.types.split(',') as ContentType[] : undefined,
            filter: options.filter ? JSON.parse(options.filter) : undefined,
            format: options.format as 'json' | 'markdown' | 'html' | undefined
          };
          
          const result = await this.importExportService.exportToFile(file, exportOptions);
          
          if (result.success) {
            console.log(`Export successful: ${result.exported} items exported to ${file}`);
          } else {
            console.error(`Export failed: ${result.data}`);
          }
        } catch (error) {
          console.error(`Error exporting content: ${(error as Error).message}`);
        }
      });
  }

  /**
   * Sets up interactive mode
   */
  private setupInteractiveMode(): void {
    this.program
      .command('interactive')
      .description('Start interactive mode')
      .action(() => {
        this.startInteractiveMode();
      });
  }

  /**
   * Starts interactive mode
   */
  private startInteractiveMode(): void {
    this.interactive = true;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'uorcontent> ',
      completer: this.completer.bind(this)
    });
    
    console.log('UOR Content Management CLI Interactive Mode');
    console.log('Type "help" for a list of commands, "exit" to quit');
    
    this.rl.prompt();
    
    this.rl.on('line', async (line) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'exit' || trimmedLine === 'quit') {
        this.stopInteractiveMode();
        return;
      }
      
      if (trimmedLine === 'help') {
        this.showHelp();
      } else if (trimmedLine) {
        try {
          await this.program.parseAsync(trimmedLine.split(/\s+/), { from: 'user' });
        } catch (error) {
          console.error(`Error: ${(error as Error).message}`);
        }
      }
      
      this.rl?.prompt();
    });
    
    this.rl.on('close', () => {
      this.stopInteractiveMode();
    });
  }

  /**
   * Stops interactive mode
   */
  private stopInteractiveMode(): void {
    this.interactive = false;
    
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    
    console.log('Goodbye!');
  }

  /**
   * Shows help in interactive mode
   */
  private showHelp(): void {
    console.log('Available commands:');
    console.log('  content create <type> [options]   Create a new content item');
    console.log('  content get <type> <id> [options] Get a content item by ID');
    console.log('  content update <type> <id> [options] Update a content item');
    console.log('  content delete <type> <id> [options] Delete a content item');
    console.log('  content list <type> [options]     List content items');
    console.log('  content stats                     Get repository statistics');
    console.log('  content health                    Check repository health');
    console.log('  query search [options]            Search content');
    console.log('  validate item <type> [options]    Validate a content item');
    console.log('  validate type <type> [options]    Validate all content of a specific type');
    console.log('  validate repository [options]     Validate the entire repository');
    console.log('  io import <file> [options]        Import content from a file');
    console.log('  io export <file> [options]        Export content to a file');
    console.log('  help                              Show this help');
    console.log('  exit                              Exit interactive mode');
  }

  /**
   * Command completer for interactive mode
   * @param line Partial command line
   * @returns Completion candidates
   */
  private completer(line: string): [string[], string] {
    const completions = [
      'content create', 'content get', 'content update', 'content delete',
      'content list', 'content stats', 'content health',
      'query search',
      'validate item', 'validate type', 'validate repository',
      'io import', 'io export',
      'help', 'exit'
    ];
    
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
  }

  /**
   * Validates a content type
   * @param type Content type string
   * @returns Validated content type
   */
  private validateContentType(type: string): ContentType {
    const contentType = type.toLowerCase() as ContentType;
    
    if (
      contentType !== 'concept' &&
      contentType !== 'resource' &&
      contentType !== 'topic' &&
      contentType !== 'predicate' &&
      contentType !== 'relationship'
    ) {
      throw new Error(`Invalid content type: ${type}`);
    }
    
    return contentType;
  }

  /**
   * Gets content data from options
   * @param options Command options
   * @returns Content data
   */
  private async getContentData(options: { file?: string; data?: string }): Promise<ContentItem | null> {
    if (options.file) {
      try {
        const content = await fs.promises.readFile(options.file, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        throw new Error(`Failed to read file: ${(error as Error).message}`);
      }
    }
    
    if (options.data) {
      try {
        return JSON.parse(options.data);
      } catch (error) {
        throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
      }
    }
    
    return null;
  }

  /**
   * Prompts for confirmation
   * @param message Confirmation message
   * @returns True if confirmed, false otherwise
   */
  private async confirm(message: string): Promise<boolean> {
    if (!this.interactive) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise<boolean>((resolve) => {
        rl.question(`${message} (y/n) `, (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
    } else {
      return new Promise<boolean>((resolve) => {
        this.rl?.question(`${message} (y/n) `, (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
    }
  }

  /**
   * Parses command-line arguments and executes commands
   * @param args Command-line arguments
   * @returns Promise that resolves with the Command object
   */
  public async parse(args: string[]): Promise<Command> {
    return this.program.parseAsync(args);
  }
}

/**
 * CLI entry point
 */
export async function runCLI(): Promise<void> {
  console.log('UOR Content Management CLI not yet implemented');
}
