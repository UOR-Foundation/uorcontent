/**
 * Index Manager
 * 
 * Provides functionality for managing content indexes with incremental updates,
 * validation, and repair capabilities.
 * 
 * Implementation for Issue #7: Index Management with incremental updates
 */

import { FileSystem } from '../utils/file-system';
import { UORContentItem, ContentIndex, ItemListElement } from '../models/types';
import path from 'path';

/**
 * Index validation result
 */
export interface IndexValidationResult {
  valid: boolean;
  errors: string[];
  missingItems: string[];
  orphanedItems: string[];
}

/**
 * Index query options
 */
export interface IndexQuery {
  type?: string;
  name?: string;
  id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Index query result
 */
export interface IndexQueryResult {
  items: UORContentItem[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Index event types
 */
export enum IndexEventType {
  UPDATED = 'index:updated',
  VALIDATED = 'index:validated',
  REPAIRED = 'index:repaired'
}

/**
 * Index event payload
 */
export interface IndexEvent {
  type: IndexEventType;
  contentType: string;
  timestamp: string;
}

/**
 * Index event listener
 */
export type IndexEventListener = (event: IndexEvent) => void;

/**
 * Index Manager class
 * Implements index management with incremental updates, validation, and repair
 */
export class IndexManager {
  private eventListeners: Map<IndexEventType, IndexEventListener[]> = new Map();
  private contentDir: string;
  private indexCache: Map<string, { index: ContentIndex, timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new IndexManager
   * 
   * @param fileSystem - File system implementation
   * @param contentDir - Content directory (default: 'converted')
   */
  constructor(
    private fileSystem: FileSystem,
    contentDir = 'converted'
  ) {
    this.contentDir = contentDir;
    
    Object.values(IndexEventType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * Add event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  addEventListener(type: IndexEventType, listener: IndexEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  removeEventListener(type: IndexEventType, listener: IndexEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  /**
   * Emit event
   * 
   * @param type - Event type
   * @param contentType - Content type
   */
  private emitEvent(type: IndexEventType, contentType: string): void {
    const listeners = this.eventListeners.get(type) || [];
    const event: IndexEvent = { 
      type, 
      contentType, 
      timestamp: new Date().toISOString() 
    };
    
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in index event listener for ${type}:`, error);
      }
    }
  }

  /**
   * Get index file path
   * 
   * @param contentType - Content type
   * @returns Absolute file path
   */
  private getIndexPath(contentType: string): string {
    if (contentType === 'all') {
      return path.join(this.contentDir, 'index.json');
    }
    return path.join(this.contentDir, `${contentType}s-index.json`);
  }

  /**
   * Get content directory path
   * 
   * @param contentType - Content type
   * @returns Absolute directory path
   */
  private getContentDirPath(contentType: string): string {
    return path.join(this.contentDir, `${contentType}s`);
  }

  /**
   * Read index from file or cache
   * 
   * @param contentType - Content type
   * @returns Content index
   */
  async readIndex(contentType: string): Promise<ContentIndex> {
    const cacheKey = contentType;
    const cached = this.indexCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.index;
    }
    
    const indexPath = this.getIndexPath(contentType);
    const index = await this.fileSystem.readJsonFile<ContentIndex>(indexPath);
    
    this.indexCache.set(cacheKey, {
      index,
      timestamp: Date.now()
    });
    
    return index;
  }

  /**
   * Write index to file and update cache
   * 
   * @param contentType - Content type
   * @param index - Content index
   */
  private async writeIndex(contentType: string, index: ContentIndex): Promise<void> {
    const indexPath = this.getIndexPath(contentType);
    await this.fileSystem.writeJsonFile(indexPath, index);
    
    this.indexCache.set(contentType, {
      index,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate index cache
   * 
   * @param contentType - Content type (optional, invalidates all if not provided)
   */
  invalidateCache(contentType?: string): void {
    if (contentType) {
      this.indexCache.delete(contentType);
    } else {
      this.indexCache.clear();
    }
  }

  /**
   * Generate index for content type
   * 
   * @param contentType - Content type
   */
  async generateIndex(contentType: string): Promise<void> {
    const contentDir = this.getContentDirPath(contentType);
    const files = await this.fileSystem.listDirectory(contentDir);
    
    const items: UORContentItem[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const item = await this.fileSystem.readJsonFile<UORContentItem>(
            path.join(contentDir, file)
          );
          items.push(item);
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
    }
    
    const index: ContentIndex = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `UOR ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}s Index`,
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@id': item['@id'] || '',
          '@type': item['@type'],
          name: item.name
        }
      }))
    };
    
    await this.writeIndex(contentType, index);
    this.emitEvent(IndexEventType.UPDATED, contentType);
    
    if (contentType !== 'all') {
      await this.updateMasterIndex();
    }
  }

  /**
   * Update index with a single item
   * 
   * @param contentType - Content type
   * @param id - Item ID
   * @param item - Item data (null for deletion)
   */
  async updateIndex(contentType: string, id: string, item: UORContentItem | null): Promise<void> {
    const index = await this.readIndex(contentType);
    
    if (item === null) {
      const itemIndex = index.itemListElement.findIndex(
        element => element.item['@id'] === id
      );
      
      if (itemIndex >= 0) {
        index.itemListElement.splice(itemIndex, 1);
        
        index.itemListElement.forEach((element, i) => {
          element.position = i + 1;
        });
        
        index.numberOfItems = index.itemListElement.length;
      }
    } else {
      const itemIndex = index.itemListElement.findIndex(
        element => element.item['@id'] === id
      );
      
      const listItem: ItemListElement = {
        '@type': 'ListItem',
        position: 0,
        item: {
          '@id': id,
          '@type': item['@type'],
          name: item.name
        }
      };
      
      if (itemIndex >= 0) {
        index.itemListElement[itemIndex] = listItem;
      } else {
        listItem.position = index.itemListElement.length + 1;
        index.itemListElement.push(listItem);
        index.numberOfItems = index.itemListElement.length;
      }
      
      index.itemListElement.forEach((element, i) => {
        element.position = i + 1;
      });
    }
    
    await this.writeIndex(contentType, index);
    this.emitEvent(IndexEventType.UPDATED, contentType);
    
    if (contentType !== 'all') {
      await this.updateMasterIndex();
    }
  }

  /**
   * Update master index
   */
  private async updateMasterIndex(): Promise<void> {
    const contentTypes = ['concept', 'predicate', 'resource', 'topic'];
    const indices: ContentIndex[] = [];
    
    for (const type of contentTypes) {
      try {
        const index = await this.readIndex(type);
        indices.push(index);
      } catch (error) {
        console.error(`Error reading ${type} index:`, error);
      }
    }
    
    const masterIndex: ContentIndex = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'UOR Content Index',
      numberOfItems: 0,
      itemListElement: []
    };
    
    let position = 1;
    for (const index of indices) {
      for (const element of index.itemListElement) {
        masterIndex.itemListElement.push({
          '@type': 'ListItem',
          position: position++,
          item: element.item
        });
      }
    }
    
    masterIndex.numberOfItems = masterIndex.itemListElement.length;
    
    await this.writeIndex('all', masterIndex);
    this.emitEvent(IndexEventType.UPDATED, 'all');
  }

  /**
   * Validate index for content type
   * 
   * @param contentType - Content type
   * @returns Validation result
   */
  async validateIndex(contentType: string): Promise<IndexValidationResult> {
    const result: IndexValidationResult = {
      valid: true,
      errors: [],
      missingItems: [],
      orphanedItems: []
    };
    
    try {
      const index = await this.readIndex(contentType);
      
      const contentDir = this.getContentDirPath(contentType);
      const files = await this.fileSystem.listDirectory(contentDir);
      
      const indexedIds = new Set(
        index.itemListElement.map(element => element.item['@id'])
      );
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const item = await this.fileSystem.readJsonFile<UORContentItem>(
              path.join(contentDir, file)
            );
            
            if (item['@id'] && !indexedIds.has(item['@id'])) {
              result.missingItems.push(item['@id']);
              result.valid = false;
            }
          } catch (error: unknown) {
            result.errors.push(`Error reading file ${file}: ${error instanceof Error ? error.message : String(error)}`);
            result.valid = false;
          }
        }
      }
      
      const fileIds = new Set<string>();
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const item = await this.fileSystem.readJsonFile<UORContentItem>(
              path.join(contentDir, file)
            );
            
            if (item['@id']) {
              fileIds.add(item['@id']);
            }
          } catch (error) {
          }
        }
      }
      
      for (const element of index.itemListElement) {
        if (element.item['@id'] && !fileIds.has(element.item['@id'])) {
          result.orphanedItems.push(element.item['@id']);
          result.valid = false;
        }
      }
      
      const positions = new Set<number>();
      for (const element of index.itemListElement) {
        if (positions.has(element.position)) {
          result.errors.push(`Duplicate position: ${element.position}`);
          result.valid = false;
        }
        positions.add(element.position);
      }
      
      if (index.numberOfItems !== index.itemListElement.length) {
        result.errors.push(
          `numberOfItems (${index.numberOfItems}) doesn't match actual count (${index.itemListElement.length})`
        );
        result.valid = false;
      }
    } catch (error: unknown) {
      result.errors.push(`Error validating index: ${error instanceof Error ? error.message : String(error)}`);
      result.valid = false;
    }
    
    this.emitEvent(IndexEventType.VALIDATED, contentType);
    
    return result;
  }

  /**
   * Repair index for content type
   * 
   * @param contentType - Content type
   * @returns Validation result after repair
   */
  async repairIndex(contentType: string): Promise<IndexValidationResult> {
    await this.generateIndex(contentType);
    
    const result = await this.validateIndex(contentType);
    
    this.emitEvent(IndexEventType.REPAIRED, contentType);
    
    return result;
  }

  /**
   * Query index
   * 
   * @param contentType - Content type
   * @param query - Query options
   * @returns Query result
   */
  async queryIndex(contentType: string, query: IndexQuery): Promise<IndexQueryResult> {
    const index = await this.readIndex(contentType);
    
    let items = index.itemListElement.map(element => element.item);
    
    if (query.type) {
      items = items.filter(item => item['@type'] === query.type);
    }
    
    if (query.name) {
      const lowerName = query.name.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(lowerName)
      );
    }
    
    if (query.id) {
      items = items.filter(item => item['@id'] === query.id);
    }
    
    const totalCount = items.length;
    
    const offset = query.offset || 0;
    const limit = query.limit || totalCount;
    
    const paginatedItems = items.slice(offset, offset + limit);
    
    const fullItems: UORContentItem[] = [];
    for (const item of paginatedItems) {
      try {
        const id = item['@id'];
        if (id) {
          const idParts = id.split(':');
          const type = idParts[1];
          const name = idParts[2];
          
          const typeCode = type.charAt(0).toUpperCase();
          const filePath = path.join(
            this.contentDir,
            `${type}s`,
            `UOR-${typeCode}-${name}.json`
          );
          
          const fullItem = await this.fileSystem.readJsonFile<UORContentItem>(filePath);
          fullItems.push(fullItem);
        }
      } catch (error) {
        console.error(`Error loading full item ${item['@id']}:`, error);
      }
    }
    
    return {
      items: fullItems,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }
}
