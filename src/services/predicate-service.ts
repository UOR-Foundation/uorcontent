/**
 * Predicate Service
 * 
 * This service provides methods for managing predicates.
 * It handles the business logic for predicate operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidatorAdapter } from '../utils/schema-validator-adapter';
import { PredicateManager } from '../managers/predicate-manager';
import { Predicate } from '../models/types';

/**
 * Predicate service
 */
export class PredicateService {
  private predicateManager: PredicateManager;

  /**
   * Create a new predicate service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    const validator = SchemaValidatorAdapter.createWithSingleton();
    this.predicateManager = new PredicateManager(fileSystem, validator);
  }

  /**
   * Get all predicates
   * 
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Paginated list of predicates
   */
  public async getAllPredicates(
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const items = await this.predicateManager.list();
    
    const paginatedItems = items.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Predicates',
      'description': 'List of UOR predicate items',
      'numberOfItems': items.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Get predicate by ID
   * 
   * @param id - Predicate ID
   * @returns Predicate item or null if not found
   */
  public async getPredicateById(id: string): Promise<Predicate | null> {
    return this.predicateManager.read(id);
  }

  /**
   * Create new predicate
   * 
   * @param predicateData - Predicate data
   * @returns Created predicate item
   */
  public async createPredicate(predicateData: Predicate): Promise<Predicate> {
    return this.predicateManager.create(predicateData);
  }

  /**
   * Update predicate by ID
   * 
   * @param id - Predicate ID
   * @param predicateData - Partial predicate data
   * @returns Updated predicate item or null if not found
   */
  public async updatePredicate(
    id: string,
    predicateData: Partial<Predicate>
  ): Promise<Predicate | null> {
    const partialPredicate = {
      ...predicateData,
      '@type': 'PropertyValue'
    } as import('../models/types').PartialPredicate;
    
    return this.predicateManager.update(id, partialPredicate);
  }

  /**
   * Delete predicate by ID
   * 
   * @param id - Predicate ID
   * @returns True if predicate was deleted, false if not found
   */
  public async deletePredicate(id: string): Promise<boolean> {
    return this.predicateManager.delete(id);
  }
}
