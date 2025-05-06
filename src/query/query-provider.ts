/**
 * Query Provider Interface
 * 
 * Defines the interface for pluggable query providers that can be used
 * to filter, search, and paginate content items.
 * 
 * Implementation for Issue #6: Query Operations with pluggable providers
 */

import { UORContentItem } from '../models/types';

/**
 * Filter criteria for query operations
 */
export interface FilterCriteria {
  [key: string]: unknown;
}

/**
 * Pagination options for query results
 */
export interface PaginationOptions {
  limit: number;
  offset?: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

/**
 * Sort options for query results
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

/**
 * Query provider interface
 * Defines methods for filtering, searching, and paginating content
 */
export interface QueryProvider<T extends UORContentItem> {
  /**
   * Filter items based on criteria
   * 
   * @param items - Array of items to filter
   * @param criteria - Filter criteria
   * @returns Filtered items
   */
  filter(items: T[], criteria: FilterCriteria): T[];
  
  /**
   * Search items based on text query
   * 
   * @param items - Array of items to search
   * @param query - Search query
   * @returns Matching items
   */
  search(items: T[], query: string): T[];
  
  /**
   * Paginate items
   * 
   * @param items - Array of items to paginate
   * @param options - Pagination options
   * @returns Paginated result
   */
  paginate(items: T[], options: PaginationOptions): PaginatedResult<T>;
  
  /**
   * Sort items
   * 
   * @param items - Array of items to sort
   * @param options - Sort options
   * @returns Sorted items
   */
  sort(items: T[], options: SortOptions): T[];
}

/**
 * In-memory query provider implementation
 * Provides basic filtering, searching, and pagination for in-memory collections
 */
export class InMemoryQueryProvider<T extends UORContentItem> implements QueryProvider<T> {
  /**
   * Filter items based on criteria
   * 
   * @param items - Array of items to filter
   * @param criteria - Filter criteria
   * @returns Filtered items
   */
  filter(items: T[], criteria: FilterCriteria): T[] {
    return items.filter(item => {
      for (const [key, value] of Object.entries(criteria)) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let current: any = item;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] === undefined) {
              return false;
            }
            current = current[parts[i]];
          }
          
          const finalProp = parts[parts.length - 1];
          if (current[finalProp] !== value) {
            return false;
          }
        } else {
          if ((item as any)[key] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }
  
  /**
   * Search items based on text query
   * 
   * @param items - Array of items to search
   * @param query - Search query
   * @returns Matching items
   */
  search(items: T[], query: string): T[] {
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item => {
      if (
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      ) {
        return true;
      }
      
      if (item['@type'] === 'DefinedTerm') {
        const concept = item as any;
        
        if (concept.termCode && concept.termCode.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        if (concept.mathExpression && Array.isArray(concept.mathExpression)) {
          for (const expr of concept.mathExpression) {
            if (expr.toLowerCase().includes(lowerQuery)) {
              return true;
            }
          }
        }
      }
      
      return false;
    });
  }
  
  /**
   * Paginate items
   * 
   * @param items - Array of items to paginate
   * @param options - Pagination options
   * @returns Paginated result
   */
  paginate(items: T[], options: PaginationOptions): PaginatedResult<T> {
    const { limit, offset = 0 } = options;
    
    const totalCount = items.length;
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const pageItems = items.slice(startIndex, endIndex);
    
    const startCursor = startIndex > 0 ? this.encodeCursor(startIndex) : undefined;
    const endCursor = endIndex < totalCount ? this.encodeCursor(endIndex) : undefined;
    
    return {
      items: pageItems,
      totalCount,
      hasNextPage: endIndex < totalCount,
      hasPreviousPage: startIndex > 0,
      startCursor,
      endCursor
    };
  }
  
  /**
   * Sort items
   * 
   * @param items - Array of items to sort
   * @param options - Sort options
   * @returns Sorted items
   */
  sort(items: T[], options: SortOptions): T[] {
    const { field, direction } = options;
    
    return [...items].sort((a, b) => {
      if (field.includes('.')) {
        const parts = field.split('.');
        let valueA: any = a;
        let valueB: any = b;
        
        for (const part of parts) {
          valueA = valueA?.[part];
          valueB = valueB?.[part];
        }
        
        if (valueA === undefined && valueB === undefined) return 0;
        if (valueA === undefined) return direction === 'asc' ? -1 : 1;
        if (valueB === undefined) return direction === 'asc' ? 1 : -1;
        
        return direction === 'asc'
          ? this.compareValues(valueA, valueB)
          : this.compareValues(valueB, valueA);
      } else {
        const valueA = (a as any)[field];
        const valueB = (b as any)[field];
        
        if (valueA === undefined && valueB === undefined) return 0;
        if (valueA === undefined) return direction === 'asc' ? -1 : 1;
        if (valueB === undefined) return direction === 'asc' ? 1 : -1;
        
        return direction === 'asc'
          ? this.compareValues(valueA, valueB)
          : this.compareValues(valueB, valueA);
      }
    });
  }
  
  /**
   * Compare values for sorting
   * 
   * @param a - First value
   * @param b - Second value
   * @returns Comparison result
   */
  private compareValues(a: unknown, b: unknown): number {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }
    
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }
    
    return String(a).localeCompare(String(b));
  }
  
  /**
   * Encode cursor for pagination
   * 
   * @param offset - Offset value
   * @returns Encoded cursor
   */
  private encodeCursor(offset: number): string {
    return Buffer.from(offset.toString()).toString('base64');
  }
  
  /**
   * Decode cursor for pagination
   * 
   * @param cursor - Encoded cursor
   * @returns Offset value
   */
  private decodeCursor(cursor: string): number {
    return parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10);
  }
}
