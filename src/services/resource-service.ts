/**
 * Resource Service
 * 
 * This service provides methods for managing resources.
 * It handles the business logic for resource operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { Resource } from '../models/types';

/**
 * Resource service
 */
export class ResourceService {
  private repository: ContentRepository;

  /**
   * Create a new resource service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    this.repository = new ContentRepository(fileSystem);
  }

  /**
   * Get all resources
   * 
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Paginated list of resources
   */
  public async getAllResources(
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const items = await this.repository.getAllContent('resource');
    
    const paginatedItems = items.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Resources',
      'description': 'List of UOR resource items',
      'numberOfItems': items.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Get resource by ID
   * 
   * @param id - Resource ID
   * @returns Resource item or null if not found
   */
  public async getResourceById(id: string): Promise<Resource | null> {
    return this.repository.getContentById(id) as Promise<Resource | null>;
  }

  /**
   * Create new resource
   * 
   * @param resourceData - Resource data
   * @returns Created resource item
   */
  public async createResource(resourceData: Resource): Promise<Resource> {
    return this.repository.createContent(resourceData) as Promise<Resource>;
  }

  /**
   * Update resource by ID
   * 
   * @param id - Resource ID
   * @param resourceData - Resource data
   * @returns Updated resource item or null if not found
   */
  public async updateResource(
    id: string,
    resourceData: Partial<Resource>
  ): Promise<Resource | null> {
    return this.repository.updateContent(id, resourceData) as Promise<Resource | null>;
  }

  /**
   * Delete resource by ID
   * 
   * @param id - Resource ID
   * @returns True if resource was deleted, false if not found
   */
  public async deleteResource(id: string): Promise<boolean> {
    return this.repository.deleteContent(id);
  }
}
