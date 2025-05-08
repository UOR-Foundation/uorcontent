/**
 * Resource Service
 * 
 * This service provides methods for managing resources.
 * It handles the business logic for resource operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidatorAdapter } from '../utils/schema-validator-adapter';
import { ResourceManager } from '../managers/resource-manager';
import { Resource } from '../models/types';

/**
 * Resource service
 */
export class ResourceService {
  private resourceManager: ResourceManager;

  /**
   * Create a new resource service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    const validator = SchemaValidatorAdapter.createWithSingleton();
    const contentDir = process.env.CONTENT_DIR || './content';
    this.resourceManager = new ResourceManager(fileSystem, validator, contentDir);
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

    const items = await this.resourceManager.list();
    
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
    return this.resourceManager.read(id);
  }

  /**
   * Create new resource
   * 
   * @param resourceData - Resource data
   * @returns Created resource item
   */
  public async createResource(resourceData: Resource): Promise<Resource> {
    return this.resourceManager.create(resourceData);
  }

  /**
   * Update resource by ID
   * 
   * @param id - Resource ID
   * @param resourceData - Partial resource data
   * @returns Updated resource item or null if not found
   */
  public async updateResource(
    id: string,
    resourceData: Partial<Resource>
  ): Promise<Resource | null> {
    const partialResource = {
      ...resourceData,
      '@type': 'CreativeWork'
    } as import('../models/types').PartialResource;
    
    return this.resourceManager.update(id, partialResource);
  }

  /**
   * Delete resource by ID
   * 
   * @param id - Resource ID
   * @returns True if resource was deleted, false if not found
   */
  public async deleteResource(id: string): Promise<boolean> {
    return this.resourceManager.delete(id);
  }
}
