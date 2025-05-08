/**
 * Content Service
 * 
 * This service provides methods for managing content.
 * It handles the business logic for content operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { UORContentItem } from '../models/types';
import * as fs from 'fs';
import * as path from 'path';

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
  /**
   * Refresh content from the repository
   * 
   * This method forces a refresh of the content repository
   * to ensure we have the latest content.
   */
  public async refreshContent(): Promise<void> {
    console.log('Refreshing content repository');
    await this.repository.getAllContent();
    console.log('Content repository refreshed');
  }

  /**
   * Get all content items by name across all types
   * 
   * @param name - Name to search for
   * @returns Array of content items matching the name
   */
  public async getAllContentByName(name: string): Promise<UORContentItem[]> {
    console.log(`Getting all content with name: ${name}`);
    
    await this.refreshContent();
    
    const contentDir = process.env.CONTENT_DIR || 'converted';
    
    const conceptsDir = path.join(contentDir, 'concepts');
    console.log(`Scanning concepts directory: ${conceptsDir}`);
    
    const matchingItems: UORContentItem[] = [];
    
    try {
      if (fs.existsSync(conceptsDir)) {
        const files = fs.readdirSync(conceptsDir);
        console.log(`Found ${files.length} files in concepts directory`);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(conceptsDir, file);
              console.log(`Reading file: ${filePath}`);
              const content = fs.readFileSync(filePath, 'utf-8');
              const item = JSON.parse(content) as UORContentItem;
              
              if (item.name === name) {
                console.log(`DIRECT MATCH FOUND: ${item.name} (ID: ${item['@id']})`);
                matchingItems.push(item);
              }
            } catch (error) {
              console.error(`Error reading file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${conceptsDir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (matchingItems.length > 0) {
      console.log(`Found ${matchingItems.length} direct matches`);
      return matchingItems;
    }
    
    const items = await this.repository.getAllContent();
    console.log(`Found ${items.length} total items across all types`);
    
    if (items.length > 0) {
      console.log(`First few items:`);
      items.slice(0, 3).forEach(item => {
        console.log(`- ${item.name || 'unnamed'} (ID: ${item['@id'] || 'unknown'})`);
      });
    }
    
    console.log(`Filtering by name: ${name}`);
    
    console.log(`All item names:`);
    items.forEach(item => {
      console.log(`- ${item.name || 'unnamed'} (ID: ${item['@id'] || 'unknown'})`);
    });
    
    const normalizedName = name.trim().toLowerCase();
    const filteredItems = items.filter(item => {
      if (!item || !item.name) return false;
      const itemName = item.name.trim().toLowerCase();
      const matches = itemName.includes(normalizedName);
      if (matches) {
        console.log(`MATCH FOUND: ${item.name} (ID: ${item['@id']})`);
      }
      return matches;
    });
    
    console.log(`After filtering by name: ${filteredItems.length} items`);
    return filteredItems;
  }

  /**
   * Get all content items of a specific type
   * 
   * @param type - Content type
   * @param name - Optional name filter
   * @returns Array of content items
   */
  public async getAllContentByType(type: string, name?: string): Promise<UORContentItem[]> {
    console.log(`Getting all content of type: ${type}${name ? ` with name: ${name}` : ''}`);
    
    await this.refreshContent();
    
    const items = await this.repository.getAllContent(type);
    console.log(`Found ${items.length} items of type ${type}`);
    
    if (items.length > 0) {
      console.log(`First few items of type ${type}:`);
      items.slice(0, 3).forEach(item => {
        console.log(`- ${item.name || 'unnamed'} (ID: ${item['@id'] || 'unknown'})`);
      });
    }
    
    if (name) {
      console.log(`Filtering by name: ${name}`);
      
      console.log(`All item names:`);
      items.forEach(item => {
        console.log(`- ${item.name || 'unnamed'} (ID: ${item['@id'] || 'unknown'})`);
      });
      
      const normalizedName = name.trim().toLowerCase();
      const filteredItems = items.filter(item => {
        if (!item || !item.name) return false;
        const itemName = item.name.trim().toLowerCase();
        const matches = itemName === normalizedName;
        if (matches) {
          console.log(`MATCH FOUND: ${item.name} (ID: ${item['@id']})`);
        }
        return matches;
      });
      
      console.log(`After filtering by name: ${filteredItems.length} items`);
      return filteredItems;
    }
    
    return items;
  }

  /**
   * Get all content
   * 
   * @param page - Page number
   * @param limit - Number of items per page
   * @param type - Content type filter
   * @param name - Name filter
   * @returns Paginated list of content items
   */
  public async getAllContent(
    page: number,
    limit: number,
    type?: string,
    name?: string
  ): Promise<Record<string, unknown>> {
    console.log(`Content service getAllContent: page=${page}, limit=${limit}, type=${type}, name=${name}`);
    
    const skip = (page - 1) * limit;

    let items = await this.repository.getAllContent(type);
    
    if (name) {
      console.log(`Filtering by name: ${name} (before: ${items.length} items)`);
      
      console.log(`Available item names:`);
      items.forEach(item => {
        if (item.name) {
          console.log(`- ${item.name} (ID: ${item['@id']})`);
        }
      });
      
      const normalizedName = name.trim().toLowerCase();
      items = items.filter(item => {
        if (!item.name) return false;
        return item.name.trim().toLowerCase() === normalizedName;
      });
      
      console.log(`After filtering: ${items.length} items`);
    }
    
    const paginatedItems = items.slice(skip, skip + limit);
    console.log(`Paginated items: ${paginatedItems.length}`);
    
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
