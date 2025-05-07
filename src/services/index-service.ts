/**
 * Index Service
 * 
 * This service provides methods for managing content indexes.
 * It handles the business logic for index operations.
 * 
 * Implementation for Issue #7: Index Management with incremental updates
 */

import { IndexManager } from '../index-management/index-manager';
import { NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { UORContentItem } from '../models/types';

/**
 * Index service
 */
export class IndexService {
  private indexManager: IndexManager;
  private repository: ContentRepository;
  
  /**
   * Create a new index service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    this.repository = new ContentRepository(fileSystem);
    this.indexManager = new IndexManager(fileSystem);
  }
  
  /**
   * Generate index for content type
   * 
   * @param contentType - Content type
   * @returns Success status
   */
  public async generateIndex(contentType: string): Promise<Record<string, unknown>> {
    await this.indexManager.generateIndex(contentType);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ActionStatusType',
      'name': 'IndexGenerationStatus',
      'description': `Index generated for ${contentType}`,
      'status': 'CompletedActionStatus'
    };
  }
  
  /**
   * Update index with a single item
   * 
   * @param contentType - Content type
   * @param id - Item ID
   * @param item - Content item (optional)
   * @returns Success status
   */
  public async updateIndex(
    contentType: string,
    id: string,
    item?: UORContentItem
  ): Promise<Record<string, unknown>> {
    if (!item) {
      item = await this.repository.getContentById(id) as UORContentItem;
      
      if (!item) {
        throw new Error(`Item with ID ${id} not found`);
      }
    }
    
    await this.indexManager.updateIndex(contentType, id, item);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ActionStatusType',
      'name': 'IndexUpdateStatus',
      'description': `Index updated for ${contentType} item ${id}`,
      'status': 'CompletedActionStatus'
    };
  }
  
  /**
   * Validate index for content type
   * 
   * @param contentType - Content type
   * @returns Validation result
   */
  public async validateIndex(contentType: string): Promise<Record<string, unknown>> {
    const result = await this.indexManager.validateIndex(contentType);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ActionStatusType',
      'name': 'IndexValidationStatus',
      'description': `Index validation for ${contentType}`,
      'status': result.valid ? 'CompletedActionStatus' : 'FailedActionStatus',
      'result': result
    };
  }
  
  /**
   * Repair index for content type
   * 
   * @param contentType - Content type
   * @returns Repair result
   */
  public async repairIndex(contentType: string): Promise<Record<string, unknown>> {
    const result = await this.indexManager.repairIndex(contentType);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ActionStatusType',
      'name': 'IndexRepairStatus',
      'description': `Index repair for ${contentType}`,
      'status': 'CompletedActionStatus',
      'result': result
    };
  }
  
  /**
   * Query index
   * 
   * @param contentType - Content type
   * @param query - Query options
   * @returns Query results
   */
  public async queryIndex(
    contentType: string,
    query: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const result = await this.indexManager.queryIndex(contentType, query);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': `${contentType} Index Query Results`,
      'description': `Results of a query on the ${contentType} index`,
      'numberOfItems': result.items.length,
      'itemListElement': result.items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': item
      }))
    };
  }
  
  /**
   * Invalidate index cache
   * 
   * @param contentType - Content type (optional)
   * @returns Success status
   */
  public async invalidateCache(contentType?: string): Promise<Record<string, unknown>> {
    this.indexManager.invalidateCache(contentType);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ActionStatusType',
      'name': 'CacheInvalidationStatus',
      'description': contentType 
        ? `Cache invalidated for ${contentType}`
        : 'All index caches invalidated',
      'status': 'CompletedActionStatus'
    };
  }
}
