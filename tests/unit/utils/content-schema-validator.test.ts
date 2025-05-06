/**
 * Content Schema Validator Tests
 * 
 * This file contains tests for the Content Schema Validator.
 */

import { ContentSchemaValidator } from '../../../src/server/utils/content-schema-validator';

describe('ContentSchemaValidator', () => {
  let validator: ContentSchemaValidator;

  beforeEach(() => {
    validator = ContentSchemaValidator.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ContentSchemaValidator.getInstance();
      const instance2 = ContentSchemaValidator.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize the validator', async () => {
      await validator.initialize();
      
      const spy = jest.spyOn(validator as any, 'initialized', 'get');
      
      await validator.initialize();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('validateContent', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('should validate a valid concept', async () => {
      const validConcept = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        'name': 'Test Concept',
        'description': 'A test concept',
        'identifier': 'UOR-C-001-test-concept'
      };
      
      const result = await validator.validateContent('concept', validConcept);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate a valid predicate', async () => {
      const validPredicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        'name': 'Test Predicate',
        'description': 'A test predicate',
        'identifier': 'UOR-P-001-test-predicate',
        'value': 'test'
      };
      
      const result = await validator.validateContent('predicate', validPredicate);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return valid=true for unknown content types', async () => {
      const result = await validator.validateContent('unknown', {});
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
});
