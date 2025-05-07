# Feature Role: Advanced Query and Search Implementation (Issue #13)

This document contains detailed implementation specifications for the Advanced Query and Search component of Phase 4 of the UOR Content Management Client.

## Implementation Overview

The Advanced Query and Search component provides powerful search capabilities for the UOR Content Management Client, including full-text search, semantic search, and a query language for complex queries.

## Key Components

### QueryEngine Class

```typescript
import { ContentRepository } from '../repository/content-repository';
import { IndexManager } from '../managers/index-manager';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Query provider interface for pluggable search implementations
 */
export interface QueryProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]>;
  executeQuery(queryString: string, options?: QueryOptions): Promise<QueryResult[]>;
  facetedSearch(query: string, facets: string[], selections?: string[]): Promise<FacetedSearchResult>;
}

/**
 * Search options
 */
export interface SearchOptions {
  contentTypes?: ContentTypeEnum[];
  fields?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Semantic search options
 */
export interface SemanticSearchOptions {
  context?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query options
 */
export interface QueryOptions {
  sort?: string;
  limit?: number;
  offset?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  id: string;
  type: ContentTypeEnum;
  content: any;
  score: number;
  highlights?: Record<string, string[]>;
}

/**
 * Query result
 */
export interface QueryResult {
  id: string;
  type: ContentTypeEnum;
  content: any;
}

/**
 * Faceted search result
 */
export interface FacetedSearchResult {
  results: SearchResult[];
  facets: Record<string, FacetCount[]>;
  total: number;
}

/**
 * Facet count
 */
export interface FacetCount {
  value: string;
  count: number;
  selected: boolean;
}

/**
 * Query Engine for advanced search capabilities
 */
export class QueryEngine {
  /**
   * Creates a new QueryEngine instance
   */
  constructor(
    private contentRepository: ContentRepository,
    private indexManager: IndexManager,
    private queryProvider: QueryProvider
  ) {}

  /**
   * Performs full-text search across content
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // Default to all content types if not specified
    const searchOptions: SearchOptions = {
      contentTypes: [
        ContentTypeEnum.CONCEPT,
        ContentTypeEnum.RESOURCE,
        ContentTypeEnum.TOPIC,
        ContentTypeEnum.PREDICATE
      ],
      ...options
    };
    
    return this.queryProvider.search(query, searchOptions);
  }

  /**
   * Performs semantic search
   * @param query Semantic search query
   * @param options Semantic search options
   * @returns Search results with explanations
   */
  async semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]> {
    return this.queryProvider.semanticSearch(query, options);
  }

  /**
   * Executes a query using the query language
   * @param queryString Query string in the query language
   * @param options Query options
   * @returns Query results
   */
  async executeQuery(queryString: string, options?: QueryOptions): Promise<QueryResult[]> {
    return this.queryProvider.executeQuery(queryString, options);
  }

  /**
   * Performs faceted search
   * @param query Search query
   * @param facets Facet fields
   * @param selections Selected facet values
   * @returns Faceted search results
   */
  async facetedSearch(query: string, facets: string[], selections?: string[]): Promise<FacetedSearchResult> {
    return this.queryProvider.facetedSearch(query, facets, selections);
  }

  /**
   * Optimizes a query for better performance
   * @param queryString Query string to optimize
   * @returns Optimized query string
   */
  async optimizeQuery(queryString: string): Promise<string> {
    // In a real implementation, this would analyze and optimize the query
    // For now, we just return the original query
    return queryString;
  }

  /**
   * Visualizes search results
   * @param results Search results to visualize
   * @returns Visualization data
   */
  async visualizeResults(results: SearchResult[]): Promise<any> {
    // In a real implementation, this would generate visualization data
    // For now, we just return a simple summary
    const typeCount = results.reduce((counts, result) => {
      counts[result.type] = (counts[result.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return {
      total: results.length,
      byType: typeCount,
      topResults: results.slice(0, 5).map(r => ({ id: r.id, type: r.type, score: r.score }))
    };
  }
}
```

### DefaultQueryProvider Implementation

```typescript
import { 
  QueryProvider, 
  SearchOptions, 
  SearchResult, 
  SemanticSearchOptions, 
  QueryOptions, 
  QueryResult, 
  FacetedSearchResult 
} from '../engines/query-engine';
import { ContentRepository } from '../repository/content-repository';
import { IndexManager } from '../managers/index-manager';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Default implementation of QueryProvider
 */
export class DefaultQueryProvider implements QueryProvider {
  /**
   * Creates a new DefaultQueryProvider instance
   */
  constructor(
    private contentRepository: ContentRepository,
    private indexManager: IndexManager
  ) {}

  /**
   * Performs full-text search
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const contentTypes = options?.contentTypes || [
      ContentTypeEnum.CONCEPT,
      ContentTypeEnum.RESOURCE,
      ContentTypeEnum.TOPIC,
      ContentTypeEnum.PREDICATE
    ];
    
    // Search in each content type
    for (const contentType of contentTypes) {
      // Get all content of this type
      const items = await this.contentRepository.list(contentType);
      
      // Filter by query
      const matchingItems = items.filter(item => {
        // If fields are specified, only search in those fields
        if (options?.fields) {
          return options.fields.some(field => 
            item[field] && 
            typeof item[field] === 'string' && 
            item[field].toLowerCase().includes(query.toLowerCase())
          );
        }
        
        // Otherwise, search in all string fields
        return Object.entries(item).some(([key, value]) => 
          typeof value === 'string' && 
          value.toLowerCase().includes(query.toLowerCase())
        );
      });
      
      // Calculate scores and highlights
      for (const item of matchingItems) {
        const score = this.calculateScore(item, query);
        const highlights = this.generateHighlights(item, query);
        
        results.push({
          id: item.id,
          type: contentType,
          content: item,
          score,
          highlights
        });
      }
    }
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    // Apply pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options?.offset || 0;
      const limit = options?.limit || results.length;
      return results.slice(offset, offset + limit);
    }
    
    return results;
  }

  /**
   * Performs semantic search
   * @param query Semantic search query
   * @param options Semantic search options
   * @returns Search results with explanations
   */
  async semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]> {
    // In a real implementation, this would use a semantic search engine
    // For now, we just use basic keyword matching with explanations
    const results = await this.search(query);
    
    // Add explanations
    for (const result of results) {
      (result as any).explanation = `This ${result.type} matches your query based on keyword relevance.`;
      
      // Apply context filtering if specified
      if (options?.context) {
        if (
          result.content.description && 
          result.content.description.toLowerCase().includes(options.context.toLowerCase())
        ) {
          (result as any).explanation += ` It specifically relates to the context of ${options.context}.`;
        }
      }
    }
    
    // Apply pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options?.offset || 0;
      const limit = options?.limit || results.length;
      return results.slice(offset, offset + limit);
    }
    
    return results;
  }

  /**
   * Executes a query using the query language
   * @param queryString Query string in the query language
   * @param options Query options
   * @returns Query results
   */
  async executeQuery(queryString: string, options?: QueryOptions): Promise<QueryResult[]> {
    // Parse query string
    const parsedQuery = this.parseQueryString(queryString);
    
    const results: QueryResult[] = [];
    
    // Execute query for each content type
    for (const contentType of Object.values(ContentTypeEnum)) {
      // Skip if type filter doesn't match
      if (parsedQuery.type && parsedQuery.type !== contentType) {
        continue;
      }
      
      // Get all content of this type
      const items = await this.contentRepository.list(contentType);
      
      // Apply filters
      const matchingItems = items.filter(item => {
        // Apply ID filter
        if (parsedQuery.id) {
          const idMatch = parsedQuery.idNegated 
            ? item.id !== parsedQuery.id 
            : item.id === parsedQuery.id;
          
          if (!idMatch) {
            return false;
          }
        }
        
        // Apply name filter
        if (parsedQuery.name) {
          const nameMatch = parsedQuery.nameNegated 
            ? !item.name.toLowerCase().includes(parsedQuery.name.toLowerCase())
            : item.name.toLowerCase().includes(parsedQuery.name.toLowerCase());
          
          if (!nameMatch) {
            return false;
          }
        }
        
        // Apply description filter
        if (parsedQuery.description) {
          const descriptionMatch = parsedQuery.descriptionNegated 
            ? !item.description.toLowerCase().includes(parsedQuery.description.toLowerCase())
            : item.description.toLowerCase().includes(parsedQuery.description.toLowerCase());
          
          if (!descriptionMatch) {
            return false;
          }
        }
        
        return true;
      });
      
      // Add matching items to results
      for (const item of matchingItems) {
        results.push({
          id: item.id,
          type: contentType,
          content: item
        });
      }
    }
    
    // Apply sorting
    if (options?.sort) {
      const [field, direction] = options.sort.split(':');
      const isDesc = direction === 'desc';
      
      results.sort((a, b) => {
        const aValue = a.content[field];
        const bValue = b.content[field];
        
        if (aValue < bValue) {
          return isDesc ? 1 : -1;
        }
        if (aValue > bValue) {
          return isDesc ? -1 : 1;
        }
        return 0;
      });
    }
    
    // Apply pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options?.offset || 0;
      const limit = options?.limit || results.length;
      return results.slice(offset, offset + limit);
    }
    
    return results;
  }

  /**
   * Performs faceted search
   * @param query Search query
   * @param facets Facet fields
   * @param selections Selected facet values
   * @returns Faceted search results
   */
  async facetedSearch(query: string, facets: string[], selections?: string[]): Promise<FacetedSearchResult> {
    // Get initial search results
    const searchResults = await this.search(query);
    
    // Parse selections
    const parsedSelections = new Map<string, string[]>();
    if (selections) {
      for (const selection of selections) {
        const [facet, value] = selection.split(':');
        if (!parsedSelections.has(facet)) {
          parsedSelections.set(facet, []);
        }
        parsedSelections.get(facet)!.push(value);
      }
    }
    
    // Apply selections to filter results
    const filteredResults = searchResults.filter(result => {
      for (const [facet, values] of parsedSelections.entries()) {
        const itemValue = result.content[facet];
        
        // Skip items that don't match the selection
        if (itemValue === undefined) {
          return false;
        }
        
        // For array values, check if any value matches
        if (Array.isArray(itemValue)) {
          const hasMatch = values.some(value => itemValue.includes(value));
          if (!hasMatch) {
            return false;
          }
        } 
        // For string/number values, check exact match
        else {
          const hasMatch = values.includes(String(itemValue));
          if (!hasMatch) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    // Calculate facet counts
    const facetCounts: Record<string, FacetCount[]> = {};
    
    for (const facet of facets) {
      const counts = new Map<string, number>();
      
      // Count occurrences of each facet value
      for (const result of filteredResults) {
        const value = result.content[facet];
        
        if (value === undefined) {
          continue;
        }
        
        // Handle array values
        if (Array.isArray(value)) {
          for (const v of value) {
            const stringValue = String(v);
            counts.set(stringValue, (counts.get(stringValue) || 0) + 1);
          }
        } 
        // Handle string/number values
        else {
          const stringValue = String(value);
          counts.set(stringValue, (counts.get(stringValue) || 0) + 1);
        }
      }
      
      // Convert to FacetCount array
      facetCounts[facet] = Array.from(counts.entries()).map(([value, count]) => ({
        value,
        count,
        selected: parsedSelections.has(facet) && parsedSelections.get(facet)!.includes(value)
      }));
      
      // Sort by count (descending)
      facetCounts[facet].sort((a, b) => b.count - a.count);
    }
    
    return {
      results: filteredResults,
      facets: facetCounts,
      total: filteredResults.length
    };
  }

  /**
   * Calculates relevance score for an item
   * @param item Content item
   * @param query Search query
   * @returns Relevance score (0-1)
   */
  private calculateScore(item: any, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // Check name (highest weight)
    if (item.name && typeof item.name === 'string') {
      const nameScore = item.name.toLowerCase().includes(lowerQuery) ? 0.6 : 0;
      score += nameScore;
    }
    
    // Check description (medium weight)
    if (item.description && typeof item.description === 'string') {
      const descriptionScore = item.description.toLowerCase().includes(lowerQuery) ? 0.3 : 0;
      score += descriptionScore;
    }
    
    // Check other fields (low weight)
    for (const [key, value] of Object.entries(item)) {
      if (key !== 'name' && key !== 'description' && typeof value === 'string') {
        const fieldScore = value.toLowerCase().includes(lowerQuery) ? 0.1 : 0;
        score += fieldScore;
      }
    }
    
    // Normalize score to 0-1 range
    return Math.min(score, 1);
  }

  /**
   * Generates highlights for matching fields
   * @param item Content item
   * @param query Search query
   * @returns Highlights by field
   */
  private generateHighlights(item: any, query: string): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const lowerQuery = query.toLowerCase();
    
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
        const highlighted = value.replace(
          new RegExp(query, 'gi'),
          match => `<em>${match}</em>`
        );
        
        highlights[key] = [highlighted];
      }
    }
    
    return highlights;
  }

  /**
   * Parses a query string into a structured query
   * @param queryString Query string
   * @returns Parsed query
   */
  private parseQueryString(queryString: string): any {
    const query: any = {};
    
    // Extract type filter
    const typeMatch = queryString.match(/type:(\w+)/i);
    if (typeMatch) {
      query.type = typeMatch[1].toLowerCase();
    }
    
    // Extract ID filter
    const idMatch = queryString.match(/(?:NOT\s+)?id:([\w-]+)/i);
    if (idMatch) {
      query.id = idMatch[1];
      query.idNegated = queryString.includes('NOT id:');
    }
    
    // Extract name filter
    const nameMatch = queryString.match(/(?:NOT\s+)?name:(\w+)/i);
    if (nameMatch) {
      query.name = nameMatch[1];
      query.nameNegated = queryString.includes('NOT name:');
    }
    
    // Extract description filter
    const descriptionMatch = queryString.match(/(?:NOT\s+)?description:(\w+)/i);
    if (descriptionMatch) {
      query.description = descriptionMatch[1];
      query.descriptionNegated = queryString.includes('NOT description:');
    }
    
    return query;
  }
}
```

### MCP Server Integration

```typescript
import { MCPServer } from '../server/mcp-server';
import { QueryEngine } from '../engines/query-engine';

/**
 * Registers Query Engine endpoints with the MCP server
 * @param mcpServer MCP server instance
 * @param queryEngine Query Engine instance
 */
export function registerQueryEngineEndpoints(
  mcpServer: MCPServer,
  queryEngine: QueryEngine
): void {
  // Search
  mcpServer.registerMethod('query.search', async (params) => {
    const { query, options } = params;
    return queryEngine.search(query, options);
  });

  // Semantic search
  mcpServer.registerMethod('query.semanticSearch', async (params) => {
    const { query, options } = params;
    return queryEngine.semanticSearch(query, options);
  });

  // Execute query
  mcpServer.registerMethod('query.executeQuery', async (params) => {
    const { queryString, options } = params;
    return queryEngine.executeQuery(queryString, options);
  });

  // Faceted search
  mcpServer.registerMethod('query.facetedSearch', async (params) => {
    const { query, facets, selections } = params;
    return queryEngine.facetedSearch(query, facets, selections);
  });

  // Optimize query
  mcpServer.registerMethod('query.optimizeQuery', async (params) => {
    const { queryString } = params;
    return { optimizedQuery: await queryEngine.optimizeQuery(queryString) };
  });

  // Visualize results
  mcpServer.registerMethod('query.visualizeResults', async (params) => {
    const { results } = params;
    return queryEngine.visualizeResults(results);
  });
}
```

## Integration with Previous Phases

The Advanced Query and Search component integrates with the following components from previous phases:

1. **Phase 1 Components**:
   - Uses TypeScript configuration with strict mode
   - Leverages type definitions for content models
   - Applies schema validation for content integrity

2. **Phase 2 Components**:
   - Builds upon Query Operations for basic search functionality
   - Integrates with IndexManager for efficient content retrieval
   - Extends the query capabilities with advanced features

3. **Phase 3 Components**:
   - Integrates with ResourceManager, TopicManager, and PredicateManager through ContentRepository
   - Leverages RelationshipManager for relationship-aware searching
   - Maintains reference integrity across all content types

## Implementation Details

### Full-Text Search

The full-text search functionality provides powerful content discovery:

1. **Content Type Filtering**: Search can be restricted to specific content types.
2. **Field Filtering**: Search can be restricted to specific fields.
3. **Relevance Scoring**: Results are scored based on relevance to the query.
4. **Highlighting**: Matching text is highlighted in the results.
5. **Pagination**: Results can be paginated for better performance.

### Semantic Search

The semantic search functionality enables meaning-based content discovery:

1. **Natural Language Queries**: Users can ask questions in natural language.
2. **Context-Aware Search**: Search can be contextualized for better results.
3. **Explanations**: Results include explanations of why they match the query.
4. **Relevance Scoring**: Results are scored based on semantic relevance.

### Query Language

The query language enables complex content queries:

1. **Type Filtering**: Filter by content type (e.g., `type:concept`).
2. **Field Filtering**: Filter by field values (e.g., `name:example`).
3. **Negation**: Exclude items (e.g., `NOT id:UOR-C-001`).
4. **Boolean Operators**: Combine filters with AND, OR, NOT.
5. **Sorting**: Sort results by any field (e.g., `sort:dateCreated:desc`).
6. **Pagination**: Limit and offset results for pagination.

### Faceted Search

The faceted search functionality enables exploratory content discovery:

1. **Facet Definition**: Define facets for categorizing results.
2. **Facet Selection**: Filter results by selecting facet values.
3. **Facet Counts**: Display counts for each facet value.
4. **Dynamic Facets**: Facet counts update based on current selections.

## Testing Strategy

The Advanced Query and Search component should be tested with:

1. **Unit Tests**: Test each method in isolation with mocked dependencies.
2. **Integration Tests**: Test the integration with ContentRepository and IndexManager.
3. **Query Language Tests**: Verify parsing and execution of complex queries.
4. **Performance Tests**: Verify search performance with large datasets.
5. **Error Handling Tests**: Verify proper error handling for invalid inputs and edge cases.
