/**
 * Content type enumeration
 */
export type ContentType = 'concept' | 'resource' | 'topic' | 'predicate' | 'relationship';

/**
 * Content identifier type
 */
export type ContentIdentifier = string;

import { UORContentItem } from './models/types';

/**
 * Base content item interface
 * Compatible with UORContentItem from models/types.ts
 */
export interface ContentItem {
  '@id'?: ContentIdentifier;
  '@type'?: string;
  '@context'?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Type mapping for content item properties
 */
export const ContentItemPropertyMap = {
  id: '@id',
  type: '@type'
};

/**
 * Repository statistics interface
 */
export interface RepositoryStatistics {
  totalItems: number;
  itemsByType: Record<ContentType, number>;
  lastUpdated: Date;
}

/**
 * Health status interface
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues?: string[];
  timestamp: Date;
  responseTime: number;
}

/**
 * Transaction options interface
 */
export interface TransactionOptions {
  timeout?: number;
  retries?: number;
}

/**
 * Query options interface
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * Search result interface
 */
export interface SearchResult {
  item: UORContentItem;
  type: ContentType;
  score: number;
  highlights?: Record<string, string[]>;
}

/**
 * Validation options interface
 */
export interface ValidationOptions {
  validateRelationships?: boolean;
  repairMode?: boolean;
  strictMode?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  repaired?: Array<{
    item: UORContentItem;
    fixes: string[];
  }>;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/**
 * Import options interface
 */
export interface ImportOptions {
  validateBeforeImport?: boolean;
  updateExisting?: boolean;
  batchSize?: number;
}

/**
 * Export options interface
 */
export interface ExportOptions {
  format?: 'json' | 'markdown' | 'html';
  includeTypes?: ContentType[];
  filter?: Record<string, unknown>;
}

/**
 * Import result interface
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{
    item: UORContentItem;
    error: string;
  }>;
}

/**
 * Export result interface
 */
export interface ExportResult {
  success: boolean;
  exported: number;
  data: string | Record<string, unknown>;
}
