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

    const indexPath = path.join(this.contentDir, 'index.json');
    const indexContent = await this.fileSystem.readFile(indexPath);
    const index = JSON.parse(indexContent);

    return index.itemListElement.map((item: { item: UORContentItem }) => item.item);
  }

  /**
   * Get content by type
   * 
   * @param type - Content type
   * @returns Array of content items
   */
  private async getContentByType(type: string): Promise<UORContentItem[]> {
    const indexPath = path.join(this.contentDir, `${type}s-index.json`);
    const indexContent = await this.fileSystem.readFile(indexPath);
    const index = JSON.parse(indexContent);

    return index.itemListElement.map((item: { item: UORContentItem }) => item.item);
  }

  /**
   * Get content by ID
   * 
   * @param id - Content ID
   * @returns Content item or null if not found
   */
  public async getContentById(id: string): Promise<UORContentItem | null> {
    const idParts = id.split(':');
    if (idParts.length < 3) {
      return null;
    }

    const type = idParts[1];
    const name = idParts[2];

    const filePaths = [
      path.join(this.contentDir, `${type}s`, `${id}.json`),
      path.join(this.contentDir, `${type}s`, `UOR-${type.charAt(0).toUpperCase()}-${name}.json`),
      path.join(this.contentDir, 'uors', `${id}.json`),
      path.join(this.contentDir, 'uors', `UOR-U-${type}.json`)
    ];
    
    for (const filePath of filePaths) {
      try {
        const content = await this.fileSystem.readFile(filePath);
        return JSON.parse(content) as UORContentItem;
      } catch (error) {
      }
    }
    
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

    const idParts = contentData['@id'].split(':');
    const name = idParts[2];
    
    const filePath = path.join(
      this.contentDir,
      `${type}s`,
      `${contentData['@id']}.json`
    );

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
    const type = idParts[1];
    const name = idParts[2];

    const filePath = path.join(
      this.contentDir,
      `${type}s`,
      `${id}.json`
    );

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
    const type = idParts[1];
    const name = idParts[2];

    const filePath = path.join(
      this.contentDir,
      `${type}s`,
      `${id}.json`
    );

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
