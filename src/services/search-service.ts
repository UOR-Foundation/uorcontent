/**
 * Search Service
 * 
 * This service provides methods for searching across all content types.
 * It handles the business logic for search operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { UORContentItem } from '../models/types';

/**
 * Search service
 */
export class SearchService {
  private repository: ContentRepository;

  /**
   * Create a new search service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    this.repository = new ContentRepository(fileSystem);
  }

  /**
   * Basic search across all content types
   * 
   * @param query - Search query
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Search results
   */
  public async search(
    query: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const allItems = await this.repository.getAllContent();
    
    const matchedItems = this.filterItemsByQuery(allItems, query);
    const paginatedItems = matchedItems.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Search Results',
      'description': `Search results for "${query}"`,
      'numberOfItems': matchedItems.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Advanced search with multiple criteria
   * 
   * @param query - Search query
   * @param types - Content types to search
   * @param properties - Property filters
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Search results
   */
  public async advancedSearch(
    query: string,
    types: string[],
    properties: Record<string, unknown>,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    let items: UORContentItem[] = [];
    
    if (types.length > 0) {
      for (const type of types) {
        const typeItems = await this.repository.getAllContent(type);
        items = [...items, ...typeItems];
      }
    } else {
      items = await this.repository.getAllContent();
    }
    
    let matchedItems = this.filterItemsByQuery(items, query);
    
    if (Object.keys(properties).length > 0) {
      matchedItems = this.filterItemsByProperties(matchedItems, properties);
    }
    
    const paginatedItems = matchedItems.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Advanced Search Results',
      'description': `Advanced search results for "${query}"`,
      'numberOfItems': matchedItems.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Search by content type
   * 
   * @param type - Content type
   * @param query - Search query
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Search results
   */
  public async searchByType(
    type: string,
    query: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const items = await this.repository.getAllContent(type);
    
    const matchedItems = this.filterItemsByQuery(items, query);
    const paginatedItems = matchedItems.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': `UOR ${type.charAt(0).toUpperCase() + type.slice(1)} Search Results`,
      'description': `Search results for "${query}" in ${type}s`,
      'numberOfItems': matchedItems.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Search by property values
   * 
   * @param property - Property name
   * @param value - Property value
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Search results
   */
  public async searchByProperty(
    property: string,
    value: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const allItems = await this.repository.getAllContent();
    
    const matchedItems = this.filterItemsByProperties(allItems, { [property]: value });
    const paginatedItems = matchedItems.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Property Search Results',
      'description': `Search results for ${property}="${value}"`,
      'numberOfItems': matchedItems.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Filter items by query
   * 
   * @param items - Content items
   * @param query - Search query
   * @returns Filtered items
   */
  private filterItemsByQuery(items: UORContentItem[], query: string): UORContentItem[] {
    if (!query) {
      return items;
    }
    
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item => {
      const name = item.name.toLowerCase();
      const description = item.description?.toLowerCase() || '';
      
      return name.includes(lowerQuery) || description.includes(lowerQuery);
    });
  }

  /**
   * Filter items by properties
   * 
   * @param items - Content items
   * @param properties - Property filters
   * @returns Filtered items
   */
  private filterItemsByProperties(
    items: UORContentItem[],
    properties: Record<string, unknown>
  ): UORContentItem[] {
    return items.filter(item => {
      for (const [key, value] of Object.entries(properties)) {
        const itemValue = this.getNestedProperty(item, key);
        
        if (itemValue === undefined) {
          return false;
        }
        
        if (typeof itemValue === 'string' && typeof value === 'string') {
          if (!itemValue.toLowerCase().includes(value.toLowerCase())) {
            return false;
          }
        } else if (itemValue !== value) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Get nested property value
   * 
   * @param obj - Object
   * @param path - Property path
   * @returns Property value
   */
  private getNestedProperty(obj: UORContentItem, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}
