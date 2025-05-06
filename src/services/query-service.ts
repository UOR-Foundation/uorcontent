/**
 * Query Service
 * 
 * This service provides methods for querying content with filtering,
 * searching, and pagination capabilities.
 * 
 * Implementation for Issue #6: Query Operations with pluggable providers
 */

import { QueryService as CoreQueryService } from '../query/query-service';
import { UORContentItem } from '../models/types';
import { ContentRepository } from '../core/content-repository';
import { NodeFileSystem } from '../utils/file-system';
import { 
  FilterCriteria, 
  PaginationOptions, 
  SortOptions,
  InMemoryQueryProvider
} from '../query/query-provider';

/**
 * Query service
 */
export class QueryService {
  private coreQueryService: CoreQueryService<UORContentItem>;
  
  /**
   * Create a new query service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    const repository = new ContentRepository(fileSystem);
    this.coreQueryService = new CoreQueryService<UORContentItem>(repository);
    
    this.coreQueryService.registerProvider('memory', new InMemoryQueryProvider<UORContentItem>());
  }
  
  /**
   * Filter content
   * 
   * @param criteria - Filter criteria
   * @param provider - Provider name (optional)
   * @returns Filtered content
   */
  public async filterContent(
    criteria: FilterCriteria,
    provider?: string
  ): Promise<Record<string, unknown>> {
    const result = await this.coreQueryService.execute({ filter: criteria }, provider);
    
    return this.formatResult(result.items, result.totalCount);
  }
  
  /**
   * Search content
   * 
   * @param query - Search query
   * @param provider - Provider name (optional)
   * @returns Search results
   */
  public async searchContent(
    query: string,
    provider?: string
  ): Promise<Record<string, unknown>> {
    const result = await this.coreQueryService.execute({ search: query }, provider);
    
    return this.formatResult(result.items, result.totalCount);
  }
  
  /**
   * Paginate content
   * 
   * @param options - Pagination options
   * @param filter - Filter criteria (optional)
   * @param provider - Provider name (optional)
   * @returns Paginated content
   */
  public async paginateContent(
    options: PaginationOptions,
    filter?: FilterCriteria,
    provider?: string
  ): Promise<Record<string, unknown>> {
    const queryOptions: any = {
      pagination: options
    };
    
    if (filter) {
      queryOptions.filter = filter;
    }
    
    const result = await this.coreQueryService.execute(queryOptions, provider);
    
    return this.formatResult(result.items, result.totalCount, {
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      startCursor: result.startCursor,
      endCursor: result.endCursor
    });
  }
  
  /**
   * Sort content
   * 
   * @param options - Sort options
   * @param filter - Filter criteria (optional)
   * @param provider - Provider name (optional)
   * @returns Sorted content
   */
  public async sortContent(
    options: SortOptions,
    filter?: FilterCriteria,
    provider?: string
  ): Promise<Record<string, unknown>> {
    const queryOptions: any = {
      sort: options
    };
    
    if (filter) {
      queryOptions.filter = filter;
    }
    
    const result = await this.coreQueryService.execute(queryOptions, provider);
    
    return this.formatResult(result.items, result.totalCount);
  }
  
  /**
   * Execute a query with multiple options
   * 
   * @param filter - Filter criteria (optional)
   * @param search - Search query (optional)
   * @param pagination - Pagination options (optional)
   * @param sort - Sort options (optional)
   * @param provider - Provider name (optional)
   * @returns Query results
   */
  public async executeQuery(
    filter?: FilterCriteria,
    search?: string,
    pagination?: PaginationOptions,
    sort?: SortOptions,
    provider?: string
  ): Promise<Record<string, unknown>> {
    const queryOptions: any = {};
    
    if (filter) {
      queryOptions.filter = filter;
    }
    
    if (search) {
      queryOptions.search = search;
    }
    
    if (pagination) {
      queryOptions.pagination = pagination;
    }
    
    if (sort) {
      queryOptions.sort = sort;
    }
    
    const result = await this.coreQueryService.execute(queryOptions, provider);
    
    return this.formatResult(result.items, result.totalCount, {
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      startCursor: result.startCursor,
      endCursor: result.endCursor
    });
  }
  
  /**
   * Format query result as Schema.org ItemList
   * 
   * @param items - Content items
   * @param totalCount - Total count
   * @param pagination - Pagination info (optional)
   * @returns Formatted result
   */
  private formatResult(
    items: UORContentItem[],
    totalCount: number,
    pagination?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    }
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Content Query Results',
      'description': 'Results of a query operation on UOR content',
      'numberOfItems': totalCount,
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': item
      }))
    };
    
    if (pagination) {
      result.hasNextPage = pagination.hasNextPage;
      result.hasPreviousPage = pagination.hasPreviousPage;
      
      if (pagination.startCursor) {
        result.startCursor = pagination.startCursor;
      }
      
      if (pagination.endCursor) {
        result.endCursor = pagination.endCursor;
      }
    }
    
    return result;
  }
}
