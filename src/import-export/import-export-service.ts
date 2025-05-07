/**
 * Content Import/Export Service
 * Implements Issue #15
 */

import { ContentType, ContentItem, ImportOptions, ExportOptions, ImportResult, ExportResult } from '../types';
import { UORContentItem } from '../models/types';
import { ContentRepository } from '../repository/content-repository';
import { ValidationEngine } from '../validation/validation-engine';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Content Import/Export Service
 * Provides functionality for importing and exporting content in various formats
 */
export class ImportExportService {
  private repository: ContentRepository;
  private validationEngine: ValidationEngine;

  /**
   * Creates a new ImportExportService instance
   * @param repository Content repository instance
   * @param validationEngine Validation engine instance
   */
  constructor(repository: ContentRepository, validationEngine: ValidationEngine) {
    this.repository = repository;
    this.validationEngine = validationEngine;
  }

  /**
   * Imports content from JSON
   * @param json JSON string or object
   * @param options Import options
   * @returns Import result
   */
  public async importFromJson(
    json: string | Record<string, unknown>,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      const items = Array.isArray(data) ? data : [data];
      
      return await this.importItems(items, options);
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 1,
        errors: [{
          item: {
            '@context': 'https://schema.org',
            '@type': 'Error',
            'name': 'Error'
          } as UORContentItem,
          error: `Failed to parse JSON: ${(error as Error).message}`
        }]
      };
    }
  }

  /**
   * Imports content from a file
   * @param filePath Path to the file
   * @param options Import options
   * @returns Import result
   */
  public async importFromFile(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const extension = path.extname(filePath).toLowerCase();
      
      switch (extension) {
        case '.json':
          return await this.importFromJson(content, options);
        case '.md':
          return await this.importFromMarkdown(content, options);
        default:
          return {
            success: false,
            imported: 0,
            failed: 1,
            errors: [{
              item: {
            '@context': 'https://schema.org',
            '@type': 'Error',
            'name': 'Error'
          } as UORContentItem,
              error: `Unsupported file format: ${extension}`
            }]
          };
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 1,
        errors: [{
          item: {
            '@context': 'https://schema.org',
            '@type': 'Error',
            'name': 'Error'
          } as UORContentItem,
          error: `Failed to read file: ${(error as Error).message}`
        }]
      };
    }
  }

  /**
   * Imports content from Markdown
   * @param markdown Markdown string
   * @param options Import options
   * @returns Import result
   */
  private async importFromMarkdown(
    markdown: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const sections = this.parseMarkdownSections(markdown);
      const items: ContentItem[] = [];
      
      for (const section of sections) {
        const item = this.convertMarkdownSectionToContentItem(section);
        if (item) {
          items.push(item);
        }
      }
      
      return await this.importItems(items, options);
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 1,
        errors: [{
          item: {
            '@context': 'https://schema.org',
            '@type': 'Error',
            'name': 'Error'
          } as UORContentItem,
          error: `Failed to parse Markdown: ${(error as Error).message}`
        }]
      };
    }
  }

  /**
   * Parses Markdown into sections
   * @param markdown Markdown string
   * @returns Markdown sections
   */
  private parseMarkdownSections(markdown: string): Array<{
    title: string;
    content: string;
    metadata: Record<string, string>;
  }> {
    const sections: Array<{
      title: string;
      content: string;
      metadata: Record<string, string>;
    }> = [];
    
    const sectionRegex = /^#+\s+(.+)$\n((?:(?!^#+\s+).+$\n?)*)/gm;
    let match;
    
    while ((match = sectionRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      const metadata: Record<string, string> = {};
      
      const metadataRegex = /^(\w+):\s*(.+)$/gm;
      let metadataMatch;
      let metadataContent = content;
      
      while ((metadataMatch = metadataRegex.exec(content)) !== null) {
        const key = metadataMatch[1].trim();
        const value = metadataMatch[2].trim();
        metadata[key] = value;
        metadataContent = metadataContent.replace(metadataMatch[0], '').trim();
      }
      
      sections.push({
        title,
        content: metadataContent,
        metadata
      });
    }
    
    return sections;
  }

  /**
   * Converts a Markdown section to a content item
   * @param section Markdown section
   * @returns Content item
   */
  private convertMarkdownSectionToContentItem(section: {
    title: string;
    content: string;
    metadata: Record<string, string>;
  }): ContentItem | null {
    const { title, content, metadata } = section;
    
    if (!metadata.type) {
      return null;
    }
    
    const contentType = metadata.type.toLowerCase() as ContentType;
    const id = metadata.id || `${contentType}-${Date.now()}`;
    
    const item: ContentItem = {
      id,
      name: title,
      description: content
    };
    
    for (const [key, value] of Object.entries(metadata)) {
      if (key !== 'type' && key !== 'id') {
        item[key] = value;
      }
    }
    
    return item;
  }

  /**
   * Imports content items
   * @param items Content items
   * @param options Import options
   * @returns Import result
   */
  private async importItems(
    items: ContentItem[],
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: []
    };
    
    const batchSize = options.batchSize || 100;
    const batches = this.chunkArray(items, batchSize);
    
    for (const batch of batches) {
      for (const item of batch) {
        try {
          if (!item.id) {
            throw new Error('Item must have an ID');
          }
          
          const contentType = this.determineContentType(item);
          
          if (!contentType) {
            throw new Error('Could not determine content type');
          }
          
          if (options.validateBeforeImport) {
            const validationResult = await this.validationEngine.validateItem(contentType, item);
            
            if (!validationResult.valid) {
              throw new Error(`Validation failed: ${validationResult.errors?.map(e => e.message).join(', ')}`);
            }
          }
          
          const existingItem = await this.repository.readContent(contentType, item['@id'] as string);
          
          if (existingItem) {
            if (options.updateExisting) {
              await this.repository.updateContent(contentType, item['@id'] as string, item as unknown as UORContentItem);
            } else {
              throw new Error(`Item with ID ${item.id} already exists`);
            }
          } else {
            await this.repository.createContent(contentType, item as unknown as UORContentItem);
          }
          
          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors = result.errors || [];
          result.errors.push({
            item: {
              '@context': 'https://schema.org',
              '@type': item['@type'] || 'Error',
              'name': item.name || 'Error Item',
              ...item
            } as unknown as UORContentItem,
            error: (error as Error).message
          });
        }
      }
    }
    
    result.success = result.failed === 0;
    
    return result;
  }

  /**
   * Exports content to JSON
   * @param options Export options
   * @returns Export result
   */
  public async exportToJson(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const items = await this.getContentForExport(options);
      
      return {
        success: true,
        exported: items.length,
        data: JSON.stringify(items, null, 2)
      };
    } catch (error) {
      return {
        success: false,
        exported: 0,
        data: JSON.stringify({
          error: `Failed to export to JSON: ${(error as Error).message}`
        })
      };
    }
  }

  /**
   * Exports content to a file
   * @param filePath Path to the file
   * @param options Export options
   * @returns Export result
   */
  public async exportToFile(
    filePath: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const extension = path.extname(filePath).toLowerCase();
      let result: ExportResult;
      
      switch (extension) {
        case '.json':
          result = await this.exportToJson(options);
          break;
        case '.md':
          result = await this.exportToMarkdown(options);
          break;
        case '.html':
          result = await this.exportToHtml(options);
          break;
        default:
          return {
            success: false,
            exported: 0,
            data: `Unsupported file format: ${extension}`
          };
      }
      
      if (result.success) {
        await fs.writeFile(filePath, result.data as string);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        exported: 0,
        data: `Failed to write file: ${(error as Error).message}`
      };
    }
  }

  /**
   * Exports content to Markdown
   * @param options Export options
   * @returns Export result
   */
  public async exportToMarkdown(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const items = await this.getContentForExport(options);
      let markdown = '# UOR Content Export\n\n';
      
      for (const item of items) {
        markdown += this.convertContentItemToMarkdown(item);
        markdown += '\n\n';
      }
      
      return {
        success: true,
        exported: items.length,
        data: markdown
      };
    } catch (error) {
      return {
        success: false,
        exported: 0,
        data: `Failed to export to Markdown: ${(error as Error).message}`
      };
    }
  }

  /**
   * Exports content to HTML
   * @param options Export options
   * @returns Export result
   */
  public async exportToHtml(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const items = await this.getContentForExport(options);
      let html = '<!DOCTYPE html>\n<html>\n<head>\n';
      html += '<meta charset="utf-8">\n';
      html += '<title>UOR Content Export</title>\n';
      html += '<style>\n';
      html += 'body { font-family: Arial, sans-serif; margin: 20px; }\n';
      html += 'h1 { color: #333; }\n';
      html += 'h2 { color: #666; margin-top: 30px; }\n';
      html += 'dl { margin-left: 20px; }\n';
      html += 'dt { font-weight: bold; }\n';
      html += 'dd { margin-bottom: 10px; }\n';
      html += '</style>\n';
      html += '</head>\n<body>\n';
      html += '<h1>UOR Content Export</h1>\n\n';
      
      for (const item of items) {
        html += this.convertContentItemToHtml(item);
        html += '\n\n';
      }
      
      html += '</body>\n</html>';
      
      return {
        success: true,
        exported: items.length,
        data: html
      };
    } catch (error) {
      return {
        success: false,
        exported: 0,
        data: `Failed to export to HTML: ${(error as Error).message}`
      };
    }
  }

  /**
   * Gets content for export
   * @param options Export options
   * @returns Content items
   */
  private async getContentForExport(options: ExportOptions = {}): Promise<Array<ContentItem & { contentType: ContentType }>> {
    const contentTypes = options.includeTypes || ['concept', 'resource', 'topic', 'predicate', 'relationship'];
    const items: Array<ContentItem & { contentType: ContentType }> = [];
    
    for (const contentType of contentTypes) {
      const contentItems = await this.repository.listContent(contentType, {
        filter: options.filter
      });
      
      items.push(...contentItems.map(item => ({
        ...item,
        contentType
      })));
    }
    
    return items;
  }

  /**
   * Converts a content item to Markdown
   * @param item Content item
   * @returns Markdown string
   */
  private convertContentItemToMarkdown(item: ContentItem & { contentType: ContentType }): string {
    let markdown = `## ${item.name || 'Untitled'}\n\n`;
    
    markdown += `type: ${item.contentType}\n`;
    markdown += `id: ${item.id}\n`;
    
    for (const [key, value] of Object.entries(item)) {
      if (
        key !== 'name' &&
        key !== 'contentType' &&
        key !== 'id' &&
        key !== 'description' &&
        typeof value !== 'object'
      ) {
        markdown += `${key}: ${value}\n`;
      }
    }
    
    if (item.description) {
      markdown += `\n${item.description}\n`;
    }
    
    return markdown;
  }

  /**
   * Converts a content item to HTML
   * @param item Content item
   * @returns HTML string
   */
  private convertContentItemToHtml(item: ContentItem & { contentType: ContentType }): string {
    let html = `<h2>${item.name || 'Untitled'}</h2>\n`;
    html += '<dl>\n';
    
    html += `<dt>Type</dt>\n<dd>${item.contentType}</dd>\n`;
    html += `<dt>ID</dt>\n<dd>${item.id}</dd>\n`;
    
    for (const [key, value] of Object.entries(item)) {
      if (
        key !== 'name' &&
        key !== 'contentType' &&
        key !== 'id' &&
        key !== 'description' &&
        typeof value !== 'object'
      ) {
        html += `<dt>${key}</dt>\n<dd>${value}</dd>\n`;
      }
    }
    
    html += '</dl>\n';
    
    if (item.description) {
      html += `<p>${item.description}</p>\n`;
    }
    
    return html;
  }

  /**
   * Determines the content type of an item
   * @param item Content item
   * @returns Content type
   */
  private determineContentType(item: ContentItem): ContentType | null {
    if (item.contentType) {
      return item.contentType as ContentType;
    }
    
    if (item.type) {
      const type = (item.type as string).toLowerCase();
      
      if (type === 'concept' || type === 'resource' || type === 'topic' || type === 'predicate' || type === 'relationship') {
        return type as ContentType;
      }
    }
    
    if (item.sourceId && item.targetId) {
      return 'relationship';
    }
    
    if (item.definition) {
      return 'concept';
    }
    
    if (item.url || item.content) {
      return 'resource';
    }
    
    return null;
  }

  /**
   * Splits an array into chunks
   * @param array Array to split
   * @param chunkSize Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
}
