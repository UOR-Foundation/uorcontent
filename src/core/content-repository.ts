/**
 * Content Repository
 * 
 * This class provides a unified interface for managing all content types.
 * It handles the storage and retrieval of content items.
 */

import { FileSystem } from '../utils/file-system';
import { UORContentItem, isConcept, isPredicate, isResource, isTopic } from '../models/types';
import path from 'path';

/**
 * Content repository
 */
export class ContentRepository {
  private fileSystem: FileSystem;
  private contentDir: string;

  /**
   * Create a new content repository
   * 
   * @param fileSystem - File system implementation
   * @param contentDir - Content directory (default: 'converted')
   */
  constructor(fileSystem: FileSystem, contentDir = 'converted') {
    this.fileSystem = fileSystem;
    this.contentDir = contentDir;
  }

  /**
   * Get all content
   * 
   * @param type - Content type filter
   * @returns Array of content items
   */
  public async getAllContent(type?: string): Promise<UORContentItem[]> {
    if (type) {
      return this.getContentByType(type);
    }

    const types = ['concept', 'predicate', 'resource', 'topic'];
    const allItems: UORContentItem[] = [];
    
    for (const contentType of types) {
      const items = await this.getContentByType(contentType);
      allItems.push(...items);
    }
    
    console.log(`getAllContent: Found ${allItems.length} total items across all types`);
    return allItems;
  }

  /**
   * Get content by type
   * 
   * @param type - Content type
   * @returns Array of content items
   */
  private async getContentByType(type: string): Promise<UORContentItem[]> {
    console.log(`Getting content by type: ${type}`);
    console.log(`Content directory: ${this.contentDir}`);
    
    const indexPath = path.join(this.contentDir, `${type}s-index.json`);
    console.log(`Checking index file: ${indexPath}`);
    
    try {
      const indexContent = await this.fileSystem.readFile(indexPath);
      const index = JSON.parse(indexContent);
      
      if (index['@type'] === 'ItemList' && Array.isArray(index.itemListElement)) {
        console.log(`Found ${index.itemListElement.length} items in index for type ${type}`);
        
        const items = index.itemListElement.map((listItem: any) => listItem.item);
        console.log(`Extracted ${items.length} items from index`);
        
        items.slice(0, 3).forEach((item: UORContentItem) => {
          console.log(`Index item: ${item.name} (ID: ${item['@id']})`);
        });
        
        return items;
      }
    } catch (error) {
      console.log(`Index file not found or invalid, falling back to directory scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const typeDirs = [
      path.join(this.contentDir, `${type}s`),
      path.join(this.contentDir, 'converted', `${type}s`),
      path.join(this.contentDir, 'uors')
    ];
    
    const items: UORContentItem[] = [];
    const processedIds = new Set<string>(); // Track processed IDs to avoid duplicates
    
    for (const typeDir of typeDirs) {
      console.log(`Scanning directory: ${typeDir}`);
      
      try {
        let files;
        try {
          files = await this.fileSystem.listDirectory(typeDir);
          console.log(`Found ${files.length} files in ${typeDir}`);
        } catch (listError) {
          console.log(`Error listing directory: ${typeDir} - ${listError instanceof Error ? listError.message : 'Unknown error'}`);
          continue;
        }
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const isTypeFile = 
              file.startsWith(`urn:uor:${type}:`) || 
              file.startsWith(`UOR-${type.charAt(0).toUpperCase()}-`) ||
              (typeDir.endsWith('uors') && file.includes(type)) ||
              (typeDir.includes(`${type}s`)); // If it's in the type directory, it's likely of that type
              
            if (!isTypeFile) {
              continue;
            }
            try {
              const filePath = path.join(typeDir, file);
              console.log(`Reading file: ${filePath}`);
              const content = await this.fileSystem.readFile(filePath);
              const item = JSON.parse(content) as UORContentItem;
              
              if (!item['@id']) {
                console.log('Skipping item without ID');
                continue;
              }
              
              const itemId = item['@id'] as string;
              
              if (processedIds.has(itemId)) {
                console.log(`Skipping duplicate item with ID: ${itemId}`);
                continue;
              }
              
              // Verify this is the correct content type
              if (
                (type === 'concept' && item['@type'] === 'DefinedTerm') ||
                (type === 'predicate' && item['@type'] === 'PropertyValue') ||
                (type === 'resource' && item['@type'] === 'CreativeWork') ||
                (type === 'topic' && item['@type'] === 'CreativeWork')
              ) {
                console.log(`Parsed ${type} with ID: ${itemId} and name: ${item.name || 'unnamed'}`);
                items.push(item);
                processedIds.add(itemId);
              } else {
                console.log(`Skipping item with incorrect type: ${item['@type'] || 'unknown'}`);
              }
            } catch (error) {
              console.error(`Error reading file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${typeDir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Returning ${items.length} items of type ${type}`);
    return items;
  }

  /**
   * Get content by ID
   * 
   * @param id - Content ID
   * @returns Content item or null if not found
   */
  public async getContentById(id: string): Promise<UORContentItem | null> {
    console.log(`Getting content by ID: ${id}`);
    console.log(`Content directory: ${this.contentDir}`);
    
    const idParts = id.split(':');
    if (idParts.length < 3) {
      console.log(`Invalid ID format: ${id}`);
      return null;
    }

    const type = idParts.length > 2 ? idParts[2] : '';
    const name = idParts.length > 3 ? idParts[3] : '';
    console.log(`Type: ${type}, Name: ${name}`);

    const path1 = path.join(this.contentDir, `${type}s`, `${id}.json`);
    const path2 = path.join(this.contentDir, `${type}s`, `UOR-${type.charAt(0).toUpperCase()}-${name}.json`);
    const path3 = path.join(this.contentDir, 'uors', `${id}.json`);
    const path4 = path.join(this.contentDir, 'uors', `UOR-U-${type}.json`);
    
    console.log(`Path 1: ${path1}`);
    console.log(`Path 2: ${path2}`);
    console.log(`Path 3: ${path3}`);
    console.log(`Path 4: ${path4}`);
    
    const allPaths = [path1, path2, path3, path4];
    
    console.log(`Trying file paths for ID ${id}:`);
    console.log(`All paths to try: ${JSON.stringify(allPaths)}`);
    for (const filePath of allPaths) {
      console.log(`- Trying: ${filePath}`);
      try {
        const content = await this.fileSystem.readFile(filePath);
        console.log(`Found content at: ${filePath}`);
        return JSON.parse(content) as UORContentItem;
      } catch (error) {
        console.log(`  Not found at: ${filePath}`);
      }
    }
    
    console.log(`Content not found for ID: ${id}`);
    return null;
  }

  /**
   * Create new content
   * 
   * @param contentData - Content data
   * @returns Created content item
   */
  public async createContent(contentData: UORContentItem): Promise<UORContentItem> {
    let type: string;
    if (isConcept(contentData)) {
      type = 'concept';
    } else if (isPredicate(contentData)) {
      type = 'predicate';
    } else if (isResource(contentData)) {
      type = 'resource';
    } else if (isTopic(contentData)) {
      type = 'topic';
    } else {
      throw new Error('Invalid content type');
    }

    if (!contentData['@id']) {
      const name = contentData.name.toLowerCase().replace(/\s+/g, '-');
      contentData['@id'] = `urn:uor:${type}:${name}`;
    }

    console.log(`Creating content with ID: ${contentData['@id']}`);
    const idParts = contentData['@id'].split(':');
    const name = idParts.length > 3 ? idParts[3] : '';
    const idSuffix = name;
    
    // Create directory for content type
    const typeDir = path.join(this.contentDir, `${type}s`);
    try {
      await this.fileSystem.createDirectory(typeDir);
      console.log(`Ensured type directory exists: ${typeDir}`);
    } catch (error) {
      console.log(`Directory already exists or error: ${typeDir}`);
    }
    
    const filePath = path.join(
      this.contentDir,
      `${type}s`,
      `${contentData['@id']}.json`
    );
    
    console.log(`Creating content file at: ${filePath}`);
    console.log(`Content data: ${JSON.stringify(contentData, null, 2)}`);

    console.log(`Writing content to: ${filePath}`);
    await this.fileSystem.writeFile(
      filePath,
      JSON.stringify(contentData, null, 2)
    );

    await this.updateIndex(type, contentData);

    return contentData as UORContentItem;
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
    const existingContent = await this.getContentById(id);
    if (!existingContent) {
      return null;
    }

    const updatedContent = { ...existingContent, ...contentData };

    const idParts = id.split(':');
    if (idParts.length < 3) {
      return null;
    }

    const type = idParts.length > 2 ? idParts[2] : '';
    const name = idParts.length > 3 ? idParts[3] : '';

    const filePaths = [
      path.join(this.contentDir, `${type}s`, `${id}.json`),
      path.join(this.contentDir, `${type}s`, `UOR-${type.charAt(0).toUpperCase()}-${name}.json`),
      path.join(this.contentDir, 'uors', `${id}.json`),
      path.join(this.contentDir, 'uors', `UOR-U-${type}.json`)
    ];
    
    let existingFilePath = null;
    for (const filePath of filePaths) {
      try {
        await this.fileSystem.readFile(filePath);
        existingFilePath = filePath;
        break;
      } catch (error) {
      }
    }

    const filePath = existingFilePath || path.join(this.contentDir, `${type}s`, `${id}.json`);

    await this.fileSystem.writeFile(
      filePath,
      JSON.stringify(updatedContent, null, 2)
    );

    await this.updateIndex(type, updatedContent);

    return updatedContent as UORContentItem;
  }

  /**
   * Delete content by ID
   * 
   * @param id - Content ID
   * @returns True if content was deleted, false if not found
   */
  public async deleteContent(id: string): Promise<boolean> {
    const existingContent = await this.getContentById(id);
    if (!existingContent) {
      return false;
    }

    const idParts = id.split(':');
    if (idParts.length < 3) {
      return false;
    }

    const type = idParts.length > 2 ? idParts[2] : '';
    const name = idParts.length > 3 ? idParts[3] : '';

    const filePaths = [
      path.join(this.contentDir, `${type}s`, `${id}.json`),
      path.join(this.contentDir, `${type}s`, `UOR-${type.charAt(0).toUpperCase()}-${name}.json`),
      path.join(this.contentDir, 'uors', `${id}.json`),
      path.join(this.contentDir, 'uors', `UOR-U-${type}.json`)
    ];
    
    let existingFilePath = null;
    for (const filePath of filePaths) {
      try {
        await this.fileSystem.readFile(filePath);
        existingFilePath = filePath;
        break;
      } catch (error) {
      }
    }

    const filePath = existingFilePath || path.join(this.contentDir, `${type}s`, `${id}.json`);

    await this.fileSystem.deleteFile(filePath);

    await this.removeFromIndex(type, id);

    return true;
  }

  /**
   * Update the index with new or updated content
   * 
   * @param type - Content type
   * @param content - Content item
   */
  private async updateIndex(type: string, content: UORContentItem): Promise<void> {
    const indexPath = path.join(this.contentDir, `${type}s-index.json`);
    let index;
    
    try {
      const indexContent = await this.fileSystem.readFile(indexPath);
      index = JSON.parse(indexContent);
    } catch (error) {
      index = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': `UOR ${type.charAt(0).toUpperCase() + type.slice(1)}s`,
        'description': `Index of UOR ${type} items`,
        'numberOfItems': 0,
        'itemListElement': []
      };
    }

    const itemIndex = index.itemListElement.findIndex(
      (item: { item: { '@id': string } }) => item.item['@id'] === content['@id']
    );

    if (itemIndex >= 0) {
      index.itemListElement[itemIndex].item = content;
    } else {
      index.itemListElement.push({
        '@type': 'ListItem',
        'position': index.itemListElement.length + 1,
        'item': content
      });
    }

    index.numberOfItems = index.itemListElement.length;

    await this.fileSystem.writeFile(
      indexPath,
      JSON.stringify(index, null, 2)
    );

    await this.updateMasterIndex();
  }

  /**
   * Remove content from the index
   * 
   * @param type - Content type
   * @param id - Content ID
   */
  private async removeFromIndex(type: string, id: string): Promise<void> {
    const indexPath = path.join(this.contentDir, `${type}s-index.json`);
    let index;
    
    try {
      const indexContent = await this.fileSystem.readFile(indexPath);
      index = JSON.parse(indexContent);
    } catch (error) {
      return;
    }

    const itemIndex = index.itemListElement.findIndex(
      (item: { item: { '@id': string } }) => item.item['@id'] === id
    );

    if (itemIndex >= 0) {
      index.itemListElement.splice(itemIndex, 1);

      index.itemListElement.forEach((item: { position: number }, i: number) => {
        item.position = i + 1;
      });

      index.numberOfItems = index.itemListElement.length;

      await this.fileSystem.writeFile(
        indexPath,
        JSON.stringify(index, null, 2)
      );

      await this.updateMasterIndex();
    }
  }

  /**
   * Update the master index
   */
  private async updateMasterIndex(): Promise<void> {
    const types = ['concept', 'predicate', 'resource', 'topic'];
    const indices: Array<{ itemListElement: Array<{ item: UORContentItem }> }> = [];

    for (const type of types) {
      try {
        const indexPath = path.join(this.contentDir, `${type}s-index.json`);
        const indexContent = await this.fileSystem.readFile(indexPath);
        const index = JSON.parse(indexContent);
        indices.push(index);
      } catch (error) {
        indices.push({
          itemListElement: []
        });
      }
    }

    const masterIndex: {
      '@context': string;
      '@type': string;
      'name': string;
      'description': string;
      'numberOfItems': number;
      'itemListElement': Array<{
        '@type': string;
        'position': number;
        'item': UORContentItem;
      }>;
    } = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Content Index',
      'description': 'Index of all UOR content',
      'numberOfItems': 0,
      'itemListElement': []
    };

    let position = 1;
    for (const index of indices) {
      for (const item of index.itemListElement) {
        masterIndex.itemListElement.push({
          '@type': 'ListItem',
          'position': position++,
          'item': item.item
        });
      }
    }

    masterIndex.numberOfItems = masterIndex.itemListElement.length;

    const masterIndexPath = path.join(this.contentDir, 'index.json');
    await this.fileSystem.writeFile(
      masterIndexPath,
      JSON.stringify(masterIndex, null, 2)
    );
  }
}
