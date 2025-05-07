import { ContentIdentifier, ValidationResult } from '../types';
import { UORContentItem } from '../models/types';

/**
 * Base manager interface for all content types
 */
export interface BaseManager<T extends UORContentItem> {
  /**
   * Creates a new content item
   * @param content Content item data
   * @returns Created content item
   */
  create(content: T): Promise<T>;

  /**
   * Gets a content item by ID
   * @param id Content item ID
   * @returns Content item or null if not found
   */
  get(id: ContentIdentifier): Promise<T | null>;
  
  /**
   * Alias for get method
   * @param id Content item ID
   * @returns Content item or null if not found
   */
  read?(id: ContentIdentifier): Promise<T | null>;

  /**
   * Updates a content item
   * @param id Content item ID
   * @param content Updated content item data
   * @returns Updated content item
   */
  update(id: ContentIdentifier, content: T): Promise<T>;

  /**
   * Deletes a content item
   * @param id Content item ID
   * @returns True if deleted, false if not found
   */
  delete(id: ContentIdentifier): Promise<boolean>;

  /**
   * Lists content items
   * @param options List options (pagination, filtering)
   * @returns List of content items
   */
  list(options?: { limit?: number; offset?: number; filter?: Record<string, unknown> }): Promise<T[]>;

  /**
   * Counts content items
   * @returns Number of content items
   */
  count?(): Promise<number>;

  /**
   * Validates a content item
   * @param content Content item data
   * @returns Validation result
   */
  validate?(content: T): Promise<ValidationResult>;

  /**
   * Validates the index for this content type
   * @returns True if index is valid, false otherwise
   */
  validateIndex?(): Promise<boolean>;
}
