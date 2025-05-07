/**
 * Manager Extensions
 * 
 * Provides extension methods for manager classes to support
 * the Content Repository API functionality.
 */

import { ConceptManager } from './concept-manager';
import { ResourceManager } from './resource-manager';
import { TopicManager } from './topic-manager';
import { PredicateManager } from './predicate-manager';
import { RelationshipManager } from '../relationship-management/relationship-manager';

declare module './concept-manager' {
  interface ConceptManager {
    count(): Promise<number>;
    validateIndex(): Promise<boolean>;
  }
}

declare module './resource-manager' {
  interface ResourceManager {
    count(): Promise<number>;
    validateIndex(): Promise<boolean>;
  }
}

declare module './topic-manager' {
  interface TopicManager {
    count(): Promise<number>;
    validateIndex(): Promise<boolean>;
  }
}

declare module './predicate-manager' {
  interface PredicateManager {
    count(): Promise<number>;
    validateIndex(): Promise<boolean>;
  }
}

declare module '../relationship-management/relationship-manager' {
  interface RelationshipManager {
    count(): Promise<number>;
    validateIndex(): Promise<boolean>;
  }
}

/**
 * Add count method to ConceptManager
 */
ConceptManager.prototype.count = async function(): Promise<number> {
  const concepts = await this.list();
  return concepts.length;
};

/**
 * Add validateIndex method to ConceptManager
 */
ConceptManager.prototype.validateIndex = async function(): Promise<boolean> {
  try {
    const concepts = await this.list();
    const ids = concepts.map(concept => concept['@id']);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  } catch (error) {
    return false;
  }
};

/**
 * Add count method to ResourceManager
 */
ResourceManager.prototype.count = async function(): Promise<number> {
  const resources = await this.list();
  return resources.length;
};

/**
 * Add validateIndex method to ResourceManager
 */
ResourceManager.prototype.validateIndex = async function(): Promise<boolean> {
  try {
    const resources = await this.list();
    const ids = resources.map(resource => resource['@id']);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  } catch (error) {
    return false;
  }
};

/**
 * Add count method to TopicManager
 */
TopicManager.prototype.count = async function(): Promise<number> {
  const topics = await this.list();
  return topics.length;
};

/**
 * Add validateIndex method to TopicManager
 */
TopicManager.prototype.validateIndex = async function(): Promise<boolean> {
  try {
    const topics = await this.list();
    const ids = topics.map(topic => topic['@id']);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  } catch (error) {
    return false;
  }
};

/**
 * Add count method to PredicateManager
 */
PredicateManager.prototype.count = async function(): Promise<number> {
  const predicates = await this.list();
  return predicates.length;
};

/**
 * Add validateIndex method to PredicateManager
 */
PredicateManager.prototype.validateIndex = async function(): Promise<boolean> {
  try {
    const predicates = await this.list();
    const ids = predicates.map(predicate => predicate['@id']);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  } catch (error) {
    return false;
  }
};

/**
 * Add count method to RelationshipManager
 */
RelationshipManager.prototype.count = async function(): Promise<number> {
  const relationships = await this.listRelationships();
  return relationships.length;
};

/**
 * Add validateIndex method to RelationshipManager
 */
RelationshipManager.prototype.validateIndex = async function(): Promise<boolean> {
  try {
    const relationships = await this.listRelationships();
    const ids = relationships.map(relationship => relationship.id);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  } catch (error) {
    return false;
  }
};
