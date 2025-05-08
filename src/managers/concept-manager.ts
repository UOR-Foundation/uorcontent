/**
 * Concept Manager
 * 
 * Provides enhanced CRUD operations for Concept entities with validation,
 * ID generation, and index management integration.
 * 
 * Implementation for Issue #5: Concept Manager with CRUD operations
 */

import { FileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { Concept, PartialConcept } from '../models/types';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Filter options for listing concepts
 */
export interface ConceptFilter {
  name?: string;
  termCode?: string;
  inDefinedTermSet?: string;
  properties?: Record<string, unknown>;
}

/**
 * Event types for concept operations
 */
export enum ConceptEventType {
  CREATED = 'concept:created',
  UPDATED = 'concept:updated',
  DELETED = 'concept:deleted'
}

/**
 * Event payload for concept operations
 */
export interface ConceptEvent {
  type: ConceptEventType;
  conceptId: string;
  concept: Concept;
}

/**
 * Event listener for concept operations
 */
export type ConceptEventListener = (event: ConceptEvent) => void;

/**
 * Concept Manager class
 * Implements CRUD operations for concepts with validation and indexing
 */
export class ConceptManager {
  private eventListeners: Map<ConceptEventType, ConceptEventListener[]> = new Map();
  private contentDir: string;

  /**
   * Create a new ConceptManager
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
    
    Object.values(ConceptEventType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * Add event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  addEventListener(type: ConceptEventType, listener: ConceptEventListener): void {
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
  removeEventListener(type: ConceptEventType, listener: ConceptEventListener): void {
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
   * @param conceptId - Concept ID
   * @param concept - Concept data
   */
  private emitEvent(type: ConceptEventType, conceptId: string, concept: Concept): void {
    const listeners = this.eventListeners.get(type) || [];
    const event: ConceptEvent = { type, conceptId, concept };
    
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in concept event listener for ${type}:`, error);
      }
    }
  }

  /**
   * Generate concept ID
   * 
   * @param name - Concept name
   * @returns Generated ID in UOR-C-XXX-name format
   */
  private generateId(name: string): string {
    const code = uuidv4().substring(0, 8).toUpperCase();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `UOR-C-${code}-${safeName}`;
  }

  /**
   * Get concept file path
   * 
   * @param id - Concept ID
   * @returns Absolute file path
   */
  private getConceptPath(id: string): string {
    if (id.startsWith('urn:uor:concept:')) {
      return path.join(this.contentDir, 'concepts', `${id}.json`);
    } else if (id.startsWith('UOR-C-')) {
      return path.join(this.contentDir, 'concepts', `${id}.json`);
    } else {
      return path.join(this.contentDir, 'concepts', `urn:uor:concept:${id}.json`);
    }
  }

  /**
   * Create a new concept
   * 
   * @param concept - Concept data
   * @returns Created concept with ID
   * @throws Error if validation fails
   */
  async create(concept: Concept): Promise<Concept> {
    const validationResult = this.validator.validateConcept(concept);
    if (!validationResult.valid) {
      throw new Error(`Invalid concept: ${JSON.stringify(validationResult.errors)}`);
    }

    if (!concept['@id']) {
      const id = this.generateId(concept.name);
      concept['@id'] = `urn:uor:concept:${id}`;
    }

    const now = new Date().toISOString();
    concept.dateCreated = now;
    concept.dateModified = now;

    const filePath = this.getConceptPath(concept['@id'].split(':').pop() as string);
    await this.fileSystem.writeJsonFile(filePath, concept);

    this.emitEvent(
      ConceptEventType.CREATED, 
      concept['@id'], 
      concept
    );

    return concept;
  }

  /**
   * Read a concept by ID
   * 
   * @param id - Concept ID
   * @returns Concept data or null if not found
   */
  async read(id: string): Promise<Concept | null> {
    try {
      const filePath = this.getConceptPath(id);
      return await this.fileSystem.readJsonFile<Concept>(filePath);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'FileNotFoundError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a concept
   * 
   * @param id - Concept ID
   * @param updates - Partial concept updates
   * @param version - Optional version for optimistic concurrency
   * @returns Updated concept or null if not found
   * @throws Error if validation fails or version mismatch
   */
  async update(id: string, updates: PartialConcept, version?: string): Promise<Concept | null> {
    const existing = await this.read(id);
    if (!existing) {
      return null;
    }

    if (version && existing.dateModified !== version) {
      throw new Error(`Concept ${id} was modified by another process`);
    }

    const validationResult = this.validator.validatePartial(updates, 'DefinedTerm');
    if (!validationResult.valid) {
      throw new Error(`Invalid concept updates: ${JSON.stringify(validationResult.errors)}`);
    }

    const updated: Concept = { ...existing, ...updates };
    updated.dateModified = new Date().toISOString();

    const filePath = this.getConceptPath(id);
    await this.fileSystem.writeJsonFile(filePath, updated);

    this.emitEvent(
      ConceptEventType.UPDATED, 
      updated['@id'] || '', 
      updated
    );

    return updated;
  }

  /**
   * Delete a concept
   * 
   * @param id - Concept ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.read(id);
    if (!existing) {
      return false;
    }

    const filePath = this.getConceptPath(id);
    await this.fileSystem.deleteFile(filePath);

    this.emitEvent(
      ConceptEventType.DELETED, 
      existing['@id'] || '', 
      existing
    );

    return true;
  }

  /**
   * List concepts with optional filtering
   * 
   * @param filter - Optional filter criteria
   * @returns Array of concepts matching filter
   */
  async list(filter?: ConceptFilter): Promise<Concept[]> {
    const conceptsDir = path.join(this.contentDir, 'concepts');
    const files = await this.fileSystem.listDirectory(conceptsDir);
    
    const concepts: Concept[] = [];
    for (const file of files) {
      if (file.endsWith('.json') && (file.startsWith('UOR-C-') || file.startsWith('urn:uor:concept:'))) {
        try {
          const concept = await this.fileSystem.readJsonFile<Concept>(
            path.join(conceptsDir, file)
          );
          concepts.push(concept);
        } catch (error) {
          console.error(`Error reading concept file ${file}:`, error);
        }
      }
    }

    if (filter) {
      return concepts.filter(concept => {
        if (filter.name && !concept.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }

        if (filter.termCode && concept.termCode !== filter.termCode) {
          return false;
        }

        if (filter.inDefinedTermSet && 
            concept.inDefinedTermSet.name !== filter.inDefinedTermSet) {
          return false;
        }

        if (filter.properties && concept.properties) {
          for (const [key, value] of Object.entries(filter.properties)) {
            if (concept.properties[key] !== value) {
              return false;
            }
          }
        }

        return true;
      });
    }

    return concepts;
  }

  /**
   * Batch create multiple concepts
   * 
   * @param concepts - Array of concepts to create
   * @returns Array of created concepts with IDs
   */
  async batchCreate(concepts: Concept[]): Promise<Concept[]> {
    for (const concept of concepts) {
      const validationResult = this.validator.validateConcept(concept);
      if (!validationResult.valid) {
        throw new Error(`Invalid concept: ${JSON.stringify(validationResult.errors)}`);
      }
    }

    const results: Concept[] = [];
    for (const concept of concepts) {
      const created = await this.create(concept);
      results.push(created);
    }

    return results;
  }
}
