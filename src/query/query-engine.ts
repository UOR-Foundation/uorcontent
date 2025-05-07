/**
 * Advanced Query and Search Engine
 * Implements Issue #13
 */

import { ContentType, SearchResult } from '../types';
import { UORContentItem } from '../models/types';
import { ContentRepository } from '../repository/content-repository';

/**
 * Query options interface
 */
export interface QueryOptions {
  contentTypes?: ContentType[];
  filter?: Record<string, unknown>;
  fullText?: string;
  semanticQuery?: string;
  limit?: number;
  offset?: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  facets?: string[];
}

/**
 * Facet result interface
 */
export interface FacetResult {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

/**
 * Search results interface
 */
export interface SearchResults {
  items: SearchResult[];
  total: number;
  facets?: FacetResult[];
}

/**
 * Advanced Query and Search Engine
 * Provides full-text search, semantic search, and complex query capabilities
 */
export class QueryEngine {
  private repository: ContentRepository;
  private tokenizer: (text: string) => string[];
  private stopWords: Set<string>;

  /**
   * Creates a new QueryEngine instance
   * @param repository Content repository instance
   */
  constructor(repository: ContentRepository) {
    this.repository = repository;
    this.stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about',
      'as', 'of', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
    ]);
    this.tokenizer = (text: string) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 0 && !this.stopWords.has(token));
    };
  }

  /**
   * Executes a query and returns search results
   * @param options Query options
   * @returns Search results
   */
  public async query(options: QueryOptions): Promise<SearchResults> {
    const contentTypes = options.contentTypes || ['concept', 'resource', 'topic', 'predicate', 'relationship'];
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const allItems: Array<{ item: UORContentItem; type: ContentType }> = [];
    
    for (const type of contentTypes) {
      const items = await this.repository.listContent(type, {
        limit: 1000, // Get a large batch for local filtering
        filter: options.filter
      });
      
      allItems.push(...items.map(item => ({ item, type })));
    }
    
    let filteredItems = allItems;
    
    if (options.fullText) {
      filteredItems = this.applyFullTextSearch(filteredItems, options.fullText);
    }
    
    if (options.semanticQuery) {
      filteredItems = this.applySemanticSearch(filteredItems, options.semanticQuery);
    }
    
    const facets = options.facets ? this.calculateFacets(filteredItems, options.facets) : undefined;
    
    if (options.sort) {
      this.applySorting(filteredItems, options.sort);
    }
    
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    
    const searchResults: SearchResult[] = paginatedItems.map(({ item, type }) => ({
      item,
      type,
      score: 1.0, // Default score
      highlights: this.generateHighlights(item, options.fullText)
    }));
    
    return {
      items: searchResults,
      total: filteredItems.length,
      facets
    };
  }

  /**
   * Applies full-text search to content items
   * @param items Content items
   * @param query Full-text query
   * @returns Filtered and scored items
   */
  private applyFullTextSearch(
    items: Array<{ item: UORContentItem; type: ContentType }>,
    query: string
  ): Array<{ item: UORContentItem; type: ContentType; score?: number }> {
    const queryTokens = this.tokenizer(query);
    
    if (queryTokens.length === 0) {
      return items;
    }
    
    return items
      .map(itemData => {
        const { item } = itemData;
        const itemText = this.getItemText(item);
        const itemTokens = this.tokenizer(itemText);
        
        let score = 0;
        for (const queryToken of queryTokens) {
          const tokenCount = itemTokens.filter(token => token === queryToken).length;
          if (tokenCount > 0) {
            const tf = tokenCount / itemTokens.length;
            const idf = Math.log(items.length / items.filter(i => 
              this.tokenizer(this.getItemText(i.item)).includes(queryToken)
            ).length + 1);
            
            score += tf * idf;
          }
        }
        
        return { ...itemData, score };
      })
      .filter(itemData => (itemData.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Applies semantic search to content items
   * @param items Content items
   * @param query Semantic query
   * @returns Filtered and scored items
   */
  private applySemanticSearch(
    items: Array<{ item: UORContentItem; type: ContentType; score?: number }>,
    query: string
  ): Array<{ item: UORContentItem; type: ContentType; score?: number }> {
    
    const queryTokens = this.tokenizer(query);
    const synonyms: Record<string, string[]> = {
      'quick': ['fast', 'rapid', 'swift'],
      'document': ['file', 'record', 'paper'],
      'search': ['find', 'query', 'lookup'],
      'relationship': ['connection', 'link', 'association']
    };
    
    const expandedQueryTokens = new Set<string>();
    for (const token of queryTokens) {
      expandedQueryTokens.add(token);
      if (synonyms[token]) {
        for (const synonym of synonyms[token]) {
          expandedQueryTokens.add(synonym);
        }
      }
    }
    
    return items
      .map(itemData => {
        const { item, score: existingScore } = itemData;
        const itemText = this.getItemText(item);
        const itemTokens = this.tokenizer(itemText);
        
        let semanticScore = 0;
        for (const token of expandedQueryTokens) {
          if (itemTokens.includes(token)) {
            semanticScore += 1;
          }
        }
        
        semanticScore = semanticScore / expandedQueryTokens.size;
        
        const combinedScore = existingScore !== undefined
          ? (existingScore + semanticScore) / 2
          : semanticScore;
        
        return { ...itemData, score: combinedScore };
      })
      .filter(itemData => (itemData.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Calculates facets for search results
   * @param items Content items
   * @param facetFields Fields to calculate facets for
   * @returns Facet results
   */
  private calculateFacets(
    items: Array<{ item: UORContentItem; type: ContentType; score?: number }>,
    facetFields: string[]
  ): FacetResult[] {
    const facets: FacetResult[] = [];
    
    for (const field of facetFields) {
      const valueMap = new Map<string, number>();
      
      for (const { item } of items) {
        const value = this.getFieldValue(item, field);
        
        if (value !== undefined && value !== null) {
          const stringValue = String(value);
          valueMap.set(stringValue, (valueMap.get(stringValue) || 0) + 1);
        }
      }
      
      const values = Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
      
      facets.push({ field, values });
    }
    
    return facets;
  }

  /**
   * Applies sorting to content items
   * @param items Content items
   * @param sort Sort options
   */
  private applySorting(
    items: Array<{ item: UORContentItem; type: ContentType; score?: number }>,
    sort: { field: string; direction: 'asc' | 'desc' }
  ): void {
    items.sort((a, b) => {
      const aValue = this.getFieldValue(a.item, sort.field);
      const bValue = this.getFieldValue(b.item, sort.field);
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sort.direction === 'asc' ? -1 : 1;
      if (bValue === undefined) return sort.direction === 'asc' ? 1 : -1;
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Generates highlights for search results
   * @param item Content item
   * @param query Search query
   * @returns Highlights by field
   */
  private generateHighlights(
    item: UORContentItem,
    query?: string
  ): Record<string, string[]> | undefined {
    if (!query) {
      return undefined;
    }
    
    const highlights: Record<string, string[]> = {};
    const queryTokens = this.tokenizer(query);
    
    for (const [field, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        const fieldTokens = this.tokenizer(value);
        const matchingTokens = queryTokens.filter(token => fieldTokens.includes(token));
        
        if (matchingTokens.length > 0) {
          let text = value;
          for (const token of matchingTokens) {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            text = text.replace(regex, `<em>${token}</em>`);
          }
          
          highlights[field] = [text];
        }
      }
    }
    
    return Object.keys(highlights).length > 0 ? highlights : undefined;
  }

  /**
   * Gets text representation of a content item for searching
   * @param item Content item
   * @returns Text representation
   */
  private getItemText(item: UORContentItem): string {
    const textParts: string[] = [];
    
    for (const [, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        textParts.push(value);
      } else if (typeof value === 'object' && value !== null) {
        const nestedText = this.getItemText(value as UORContentItem);
        if (nestedText) {
          textParts.push(nestedText);
        }
      }
    }
    
    return textParts.join(' ');
  }

  /**
   * Gets the value of a field in a content item
   * @param item Content item
   * @param field Field name (supports dot notation for nested fields)
   * @returns Field value
   */
  private getFieldValue(item: UORContentItem, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = item;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      
      value = (value as Record<string, unknown>)[part];
    }
    
    return value;
  }
}
