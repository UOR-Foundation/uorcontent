/**
 * Predicate Manager
 * 
 * Provides enhanced CRUD operations for Predicate entities with validation,
 * ID generation, and bidirectional relationship management.
 * 
 * Implementation for Issue #10: Predicate Manager Implementation
 */

import { FileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { Predicate, PartialPredicate } from '../models/types';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Filter options for listing predicates
 */
export interface PredicateFilter {
  name?: string;
  propertyID?: string;
  value?: string;
  subjectOf?: string;
  targetCollection?: string[];
  valueName?: string;
}

/**
 * Event types for predicate operations
 */
export enum PredicateEventType {
  CREATED = 'predicate:created',
  UPDATED = 'predicate:updated',
  DELETED = 'predicate:deleted'
}

/**
 * Event payload for predicate operations
 */
export interface PredicateEvent {
  type: PredicateEventType;
  predicateId: string;
  predicate: Predicate;
}

/**
 * Event listener for predicate operations
 */
export type PredicateEventListener = (event: PredicateEvent) => void;

/**
 * Predicate Manager class
 * Implements CRUD operations for predicates with validation and bidirectional relationship management
 */
export class PredicateManager {
  private eventListeners: Map<PredicateEventType, PredicateEventListener[]> = new Map();
  private contentDir: string;

  /**
   * Create a new PredicateManager
   * 
   * @param fileSystem - File system implementation
   * @param validator - Schema validator implementation
   * @param contentDir - Content directory (default: 'converted')
   */
  constructor(
    private fileSystem: FileSystem,
    private validator: SchemaValidator,
    contentDir = 'converted'
  ) {
    this.contentDir = contentDir;
    
    Object.values(PredicateEventType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * Add event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  addEventListener(type: PredicateEventType, listener: PredicateEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  removeEventListener(type: PredicateEventType, listener: PredicateEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  /**
   * Emit event
   * 
   * @param type - Event type
   * @param predicateId - Predicate ID
   * @param predicate - Predicate data
   */
  private emitEvent(type: PredicateEventType, predicateId: string, predicate: Predicate): void {
    const listeners = this.eventListeners.get(type) || [];
    const event: PredicateEvent = { type, predicateId, predicate };
    
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in predicate event listener for ${type}:`, error);
      }
    }
  }

  /**
   * Generate predicate ID
   * 
   * @param name - Predicate name
   * @returns Generated ID in UOR-P-XXX-name format
   */
  private generateId(name: string): string {
    const code = uuidv4().substring(0, 8).toUpperCase();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `UOR-P-${code}-${safeName}`;
  }

  /**
   * Get predicate file path
   * 
   * @param id - Predicate ID
   * @returns Absolute file path
   */
  private getPredicatePath(id: string): string {
    return path.join(this.contentDir, 'predicates', `${id}.json`);
  }

  /**
   * Create a new predicate
   * 
   * @param predicate - Predicate data
   * @returns Created predicate with ID
   * @throws Error if validation fails
   */
  async create(predicate: Predicate): Promise<Predicate> {
    const validationResult = this.validator.validatePredicate(predicate);
    if (!validationResult.valid) {
      throw new Error(`Invalid predicate: ${JSON.stringify(validationResult.errors)}`);
    }

    if (!predicate['@id']) {
      const id = this.generateId(predicate.name);
      predicate['@id'] = `urn:uor:predicate:${id}`;
    }

    const now = new Date().toISOString();
    predicate.dateCreated = now;
    predicate.dateModified = now;

    if (!predicate.subjectOf || !predicate.subjectOf['@id']) {
      throw new Error('Predicate must have a subject reference');
    }

    if (!predicate.targetCollection || predicate.targetCollection.length === 0) {
      throw new Error('Predicate must have at least one target reference');
    }

    const filePath = this.getPredicatePath(predicate['@id'].split(':').pop() as string);
    await this.fileSystem.writeJsonFile(filePath, predicate);

    this.emitEvent(
      PredicateEventType.CREATED, 
      predicate['@id'], 
      predicate
    );

    return predicate;
  }

  /**
   * Read a predicate by ID
   * 
   * @param id - Predicate ID
   * @returns Predicate data or null if not found
   */
  async read(id: string): Promise<Predicate | null> {
    try {
      const filePath = this.getPredicatePath(id);
      return await this.fileSystem.readJsonFile<Predicate>(filePath);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'FileNotFoundError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a predicate
   * 
   * @param id - Predicate ID
   * @param updates - Partial predicate updates
   * @param version - Optional version for optimistic concurrency
   * @returns Updated predicate or null if not found
   * @throws Error if validation fails or version mismatch
   */
  async update(id: string, updates: PartialPredicate, version?: string): Promise<Predicate | null> {
    const existing = await this.read(id);
    if (!existing) {
      return null;
    }

    if (version && existing.dateModified !== version) {
      throw new Error(`Predicate ${id} was modified by another process`);
    }

    const validationResult = this.validator.validatePartial(updates, 'PropertyValue');
    if (!validationResult.valid) {
      throw new Error(`Invalid predicate updates: ${JSON.stringify(validationResult.errors)}`);
    }

    const updated: Predicate = { ...existing, ...updates };
    updated.dateModified = new Date().toISOString();

    if (!updated.subjectOf || !updated.subjectOf['@id']) {
      throw new Error('Predicate must have a subject reference');
    }

    if (!updated.targetCollection || updated.targetCollection.length === 0) {
      throw new Error('Predicate must have at least one target reference');
    }

    const filePath = this.getPredicatePath(id);
    await this.fileSystem.writeJsonFile(filePath, updated);

    this.emitEvent(
      PredicateEventType.UPDATED, 
      updated['@id'] || '', 
      updated
    );

    return updated;
  }

  /**
   * Delete a predicate
   * 
   * @param id - Predicate ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.read(id);
    if (!existing) {
      return false;
    }

    const filePath = this.getPredicatePath(id);
    await this.fileSystem.deleteFile(filePath);

    this.emitEvent(
      PredicateEventType.DELETED, 
      existing['@id'] || '', 
      existing
    );

    return true;
  }

  /**
   * List predicates with optional filtering
   * 
   * @param filter - Optional filter criteria
   * @returns Array of predicates matching filter
   */
  async list(filter?: PredicateFilter): Promise<Predicate[]> {
    const predicatesDir = path.join(this.contentDir, 'predicates');
    const files = await this.fileSystem.listDirectory(predicatesDir);
    
    const predicates: Predicate[] = [];
    for (const file of files) {
      if (file.endsWith('.json') && file.startsWith('UOR-P-')) {
        try {
          const predicate = await this.fileSystem.readJsonFile<Predicate>(
            path.join(predicatesDir, file)
          );
          predicates.push(predicate);
        } catch (error) {
          console.error(`Error reading predicate file ${file}:`, error);
        }
      }
    }

    if (filter) {
      return predicates.filter(predicate => {
        if (filter.name && !predicate.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }

        if (filter.propertyID && predicate.propertyID !== filter.propertyID) {
          return false;
        }

        if (filter.value && predicate.value !== filter.value) {
          return false;
        }

        if (filter.valueName && predicate.valueName !== filter.valueName) {
          return false;
        }

        if (filter.subjectOf && predicate.subjectOf['@id'] !== filter.subjectOf) {
          return false;
        }

        if (filter.targetCollection && filter.targetCollection.length > 0) {
          const hasAllTargets = filter.targetCollection.every(target => 
            predicate.targetCollection.includes(target)
          );
          if (!hasAllTargets) {
            return false;
          }
        }

        return true;
      });
    }

    return predicates;
  }

  /**
   * Batch create multiple predicates
   * 
   * @param predicates - Array of predicates to create
   * @returns Array of created predicates with IDs
   */
  async batchCreate(predicates: Predicate[]): Promise<Predicate[]> {
    for (const predicate of predicates) {
      const validationResult = this.validator.validatePredicate(predicate);
      if (!validationResult.valid) {
        throw new Error(`Invalid predicate: ${JSON.stringify(validationResult.errors)}`);
      }
    }

    const results: Predicate[] = [];
    for (const predicate of predicates) {
      const created = await this.create(predicate);
      results.push(created);
    }

    return results;
  }

  /**
   * Find predicates by subject
   * 
   * @param subjectId - Subject ID
   * @returns Array of predicates with the given subject
   */
  async findBySubject(subjectId: string): Promise<Predicate[]> {
    const fullId = subjectId.startsWith('urn:') ? subjectId : `urn:uor:${subjectId}`;
    const allPredicates = await this.list();
    
    return allPredicates.filter(predicate => 
      predicate.subjectOf['@id'] === fullId
    );
  }

  /**
   * Find predicates by target
   * 
   * @param targetId - Target ID
   * @returns Array of predicates with the given target
   */
  async findByTarget(targetId: string): Promise<Predicate[]> {
    const fullId = targetId.startsWith('urn:') ? targetId : `urn:uor:${targetId}`;
    const allPredicates = await this.list();
    
    return allPredicates.filter(predicate => 
      predicate.targetCollection.includes(fullId)
    );
  }

  /**
   * Find predicates by property ID
   * 
   * @param propertyId - Property ID
   * @returns Array of predicates with the given property ID
   */
  async findByPropertyId(propertyId: string): Promise<Predicate[]> {
    const allPredicates = await this.list();
    
    return allPredicates.filter(predicate => 
      predicate.propertyID === propertyId
    );
  }

  /**
   * Find bidirectional relationships between two entities
   * 
   * @param entityId1 - First entity ID
   * @param entityId2 - Second entity ID
   * @returns Array of predicates connecting the two entities
   */
  async findBidirectionalRelationships(entityId1: string, entityId2: string): Promise<Predicate[]> {
    const fullId1 = entityId1.startsWith('urn:') ? entityId1 : `urn:uor:${entityId1}`;
    const fullId2 = entityId2.startsWith('urn:') ? entityId2 : `urn:uor:${entityId2}`;
    const allPredicates = await this.list();
    
    return allPredicates.filter(predicate => 
      (predicate.subjectOf['@id'] === fullId1 && predicate.targetCollection.includes(fullId2)) ||
      (predicate.subjectOf['@id'] === fullId2 && predicate.targetCollection.includes(fullId1))
    );
  }
}
