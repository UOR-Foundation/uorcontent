u/**
 * Type definitions for UOR Framework content models
 * Based on schema.org templates in the UOR Framework
 */

/**
 * Base interface for all UOR content items
 */
export interface UORContentItem {
  '@context': string;
  '@type': string;
  '@id'?: string;
  name: string;
  description?: string;
  dateCreated?: string;
  dateModified?: string;
}

/**
 * Interface for Concept type based on schema.org DefinedTerm
 */
export interface Concept extends UORContentItem {
  '@type': 'DefinedTerm';
  termCode: string;
  inDefinedTermSet: {
    '@type': 'DefinedTermSet';
    name: string;
  };
  mathExpression?: string[];
  image?: string[];
  sameAs?: string[];
  url?: string;
  relatedConcepts?: string[];
  properties?: Record<string, unknown>;
  examples?: string[];
  theorems?: string[];
  corollaries?: string[];
  lemmas?: string[];
  axioms?: string[];
  proofs?: string[];
  sourceText?: string;
}

/**
 * Interface for Predicate type based on schema.org PropertyValue
 */
export interface Predicate extends UORContentItem {
  '@type': 'PropertyValue';
  propertyID: string;
  value: string;
  subjectOf: {
    '@id': string;
  };
  targetCollection: string[];
  valueName?: string;
  valueReference?: {
    '@type': 'PropertyValue';
    propertyID: string;
    value: string;
  };
  additionalProperty?: Array<{
    '@type': 'PropertyValue';
    propertyID: string;
    value: number | boolean | string;
  }>;
}

/**
 * Interface for Resource type based on schema.org CreativeWork
 */
export interface Resource extends UORContentItem {
  '@type': 'CreativeWork';
  url?: string;
  author?: string;
  publisher?: string;
  datePublished?: string;
  keywords?: string[];
  license?: string;
  citation?: string;
  contentRating?: string;
  educationalLevel?: string;
  learningResourceType?: string;
}

/**
 * Interface for Topic type based on schema.org CreativeWork
 */
export interface Topic extends UORContentItem {
  '@type': 'CreativeWork';
  keywords?: string[];
  about?: string[];
  hasPart?: string[];
  isPartOf?: string[];
  educationalLevel?: string;
  learningResourceType?: string;
}

/**
 * Type guard for Concept
 */
export function isConcept(item: UORContentItem): item is Concept {
  return item['@type'] === 'DefinedTerm';
}

/**
 * Type guard for Predicate
 */
export function isPredicate(item: UORContentItem): item is Predicate {
  return item['@type'] === 'PropertyValue' && 'propertyID' in item;
}

/**
 * Type guard for Resource
 */
export function isResource(item: UORContentItem): item is Resource {
  return item['@type'] === 'CreativeWork' && !('hasPart' in item || 'isPartOf' in item);
}

/**
 * Type guard for Topic
 */
export function isTopic(item: UORContentItem): item is Topic {
  return item['@type'] === 'CreativeWork' && ('hasPart' in item || 'isPartOf' in item);
}

/**
 * Utility type for partial content updates
 */
export type PartialConcept = Omit<Partial<Concept>, '@type'> & { '@type': 'DefinedTerm' };
export type PartialPredicate = Omit<Partial<Predicate>, '@type'> & { '@type': 'PropertyValue' };
export type PartialResource = Omit<Partial<Resource>, '@type'> & { '@type': 'CreativeWork' };
export type PartialTopic = Omit<Partial<Topic>, '@type'> & { '@type': 'CreativeWork' };

/**
 * Index types
 */
export interface ItemListElement {
  '@type': 'ListItem';
  position: number;
  item: {
    '@id': string;
    '@type': string;
    name: string;
  };
}

export interface ContentIndex extends UORContentItem {
  '@type': 'ItemList';
  numberOfItems: number;
  itemListElement: ItemListElement[];
}
