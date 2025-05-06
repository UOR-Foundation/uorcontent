/**
 * Query Service
 * 
 * Provides a service layer for query operations that integrates
 * with the MCP server and uses pluggable query providers.
 * 
 * Implementation for Issue #6: Query Operations with pluggable providers
 */

import { UORContentItem } from '../models/types';
import { 
  QueryProvider, 
  FilterCriteria, 
  PaginationOptions, 
  SortOptions, 
  PaginatedResult,
  InMemoryQueryProvider
} from './query-provider';
import { ContentRepository } from '../core/content-repository';

/**
 * Query options combining filter, search, pagination, and sort
 */
export interface QueryOptions {
  filter?: FilterCriteria;
  search?: string;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

/**
 * Query service class
 * Provides a unified interface for query operations using pluggable providers
 */
export class QueryService<T extends UORContentItem> {
  private providers: Map<string, QueryProvider<T>> = new Map();
  private defaultProvider: QueryProvider<T>;

  /**
   * Create a new QueryService
   * 
   * @param repository - Content repository
   */
  constructor(private repository: ContentRepository) {
    this.defaultProvider = new InMemoryQueryProvider<T>();
    this.registerProvider('memory', this.defaultProvider);
  }

  /**
   * Register a query provider
   * 
   * @param name - Provider name
   * @param provider - Query provider implementation
   */
  registerProvider(name: string, provider: QueryProvider<T>): void {
    this.providers.set(name, provider);
  }

  /**
   * Get a query provider by name
   * 
   * @param name - Provider name
   * @returns Query provider or default provider if not found
   */
  getProvider(name?: string): QueryProvider<T> {
    if (name && this.providers.has(name)) {
      return this.providers.get(name) as QueryProvider<T>;
    }
    return this.defaultProvider;
  }

  /**
   * Execute a query
   * 
   * @param options - Query options
   * @param providerName - Provider name (optional)
   * @returns Query result
   */
  async execute(options: QueryOptions, providerName?: string): Promise<PaginatedResult<T>> {
    const provider = this.getProvider(providerName);
    
    const items = await this.repository.getAllContent() as T[];
    
    let filteredItems = items;
    if (options.filter) {
      filteredItems = provider.filter(filteredItems, options.filter);
    }
    
    if (options.search) {
      filteredItems = provider.search(filteredItems, options.search);
    }
    
    if (options.sort) {
      filteredItems = provider.sort(filteredItems, options.sort);
    }
    
    if (options.pagination) {
      return provider.paginate(filteredItems, options.pagination);
    }
    
    return {
      items: filteredItems,
      totalCount: filteredItems.length,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  /**
   * Create a query builder
   * 
   * @param providerName - Provider name (optional)
   * @returns Query builder
   */
  createBuilder(providerName?: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this, providerName);
  }
}

/**
 * Query builder class
 * Provides a fluent API for building and executing queries
 */
export class QueryBuilder<T extends UORContentItem> {
  private options: QueryOptions = {};

  /**
   * Create a new QueryBuilder
   * 
   * @param service - Query service
   * @param providerName - Provider name (optional)
   */
  constructor(
    private service: QueryService<T>,
    private providerName?: string
  ) {}

  /**
   * Add filter criteria
   * 
   * @param criteria - Filter criteria
   * @returns This builder for chaining
   */
  filter(criteria: FilterCriteria): this {
    this.options.filter = criteria;
    return this;
  }

  /**
   * Add search query
   * 
   * @param query - Search query
   * @returns This builder for chaining
   */
  search(query: string): this {
    this.options.search = query;
    return this;
  }

  /**
   * Add pagination options
   * 
   * @param options - Pagination options
   * @returns This builder for chaining
   */
  paginate(options: PaginationOptions): this {
    this.options.pagination = options;
    return this;
  }

  /**
   * Add sort options
   * 
   * @param options - Sort options
   * @returns This builder for chaining
   */
  sort(options: SortOptions): this {
    this.options.sort = options;
    return this;
  }

  /**
   * Execute the query
   * 
   * @returns Query result
   */
  async execute(): Promise<PaginatedResult<T>> {
    return this.service.execute(this.options, this.providerName);
  }
}
