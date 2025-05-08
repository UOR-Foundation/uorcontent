/**
 * Concept Service
 * 
 * This service provides methods for managing concepts.
 * It handles the business logic for concept operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { Concept } from '../models/types';

/**
 * Concept service
 */
export class ConceptService {
  private repository: ContentRepository;

  /**
   * Create a new concept service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    const contentDir = process.env.CONTENT_DIR || './content';
    this.repository = new ContentRepository(fileSystem, contentDir);
  }

  /**
   * Get all concepts
   * 
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Paginated list of concepts
   */
  public async getAllConcepts(
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const items = await this.repository.getAllContent('concept');
    
    const paginatedItems = items.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Concepts',
      'description': 'List of UOR concept items',
      'numberOfItems': items.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Get concept by ID
   * 
   * @param id - Concept ID
   * @returns Concept item or null if not found
   */
  public async getConceptById(id: string): Promise<Concept | null> {
    return this.repository.getContentById(id) as Promise<Concept | null>;
  }

  /**
   * Create new concept
   * 
   * @param conceptData - Concept data
   * @returns Created concept item
   */
  public async createConcept(conceptData: Concept): Promise<Concept> {
    return this.repository.createContent(conceptData) as Promise<Concept>;
  }

  /**
   * Update concept by ID
   * 
   * @param id - Concept ID
   * @param conceptData - Concept data
   * @returns Updated concept item or null if not found
   */
  public async updateConcept(
    id: string,
    conceptData: Partial<Concept>
  ): Promise<Concept | null> {
    return this.repository.updateContent(id, conceptData) as Promise<Concept | null>;
  }

  /**
   * Delete concept by ID
   * 
   * @param id - Concept ID
   * @returns True if concept was deleted, false if not found
   */
  public async deleteConcept(id: string): Promise<boolean> {
    return this.repository.deleteContent(id);
  }
}
