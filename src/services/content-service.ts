/**
 * Content Service
 * 
 * This service provides methods for managing content.
 * It handles the business logic for content operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { UORContentItem } from '../models/types';

/**
 * Content service
 */
export class ContentService {
  private repository: ContentRepository;

  /**
   * Create a new content service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    this.repository = new ContentRepository(fileSystem);
  }

  /**
   * Get all content
   * 
   * @param page - Page number
   * @param limit - Number of items per page
   * @param type - Content type filter
   * @returns Paginated list of content items
   */
  public async getAllContent(
    page: number,
    limit: number,
    type?: string
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const items = await this.repository.getAllContent(type);
    
    const paginatedItems = items.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Content',
      'description': 'List of UOR content items',
      'numberOfItems': items.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Get content by ID
   * 
   * @param id - Content ID
   * @returns Content item or null if not found
   */
  public async getContentById(id: string): Promise<UORContentItem | null> {
    return this.repository.getContentById(id);
  }

  /**
   * Create new content
   * 
   * @param contentData - Content data
   * @returns Created content item
   */
  public async createContent(contentData: UORContentItem): Promise<UORContentItem> {
    return this.repository.createContent(contentData);
  }

  /**
   * Update content by ID
   * 
   * @param id - Content ID
   * @param contentData - Content data
   * @returns Updated content item or null if not found
   */
  public async updateContent(
    id: string,
    contentData: Partial<UORContentItem>
  ): Promise<UORContentItem | null> {
    return this.repository.updateContent(id, contentData);
  }

  /**
   * Delete content by ID
   * 
   * @param id - Content ID
   * @returns True if content was deleted, false if not found
   */
  public async deleteContent(id: string): Promise<boolean> {
    return this.repository.deleteContent(id);
  }
}
