/**
 * Fixture Loader
 * 
 * This utility provides functions for loading test fixtures.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Concept, Predicate, Resource, Topic } from '../../src/models/types';

/**
 * Base directory for test fixtures
 */
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

/**
 * Load a fixture file
 * 
 * @param relativePath - Path to the fixture file relative to the fixtures directory
 * @returns The parsed fixture data
 */
export function loadFixture<T>(relativePath: string): T {
  const filePath = path.join(FIXTURES_DIR, relativePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as T;
}

/**
 * Load a concept fixture
 * 
 * @param fileName - Name of the concept fixture file
 * @returns The concept fixture data
 */
export function loadConceptFixture(fileName: string): Concept {
  return loadFixture<Concept>(path.join('concepts', fileName));
}

/**
 * Load a predicate fixture
 * 
 * @param fileName - Name of the predicate fixture file
 * @returns The predicate fixture data
 */
export function loadPredicateFixture(fileName: string): Predicate {
  return loadFixture<Predicate>(path.join('predicates', fileName));
}

/**
 * Load a resource fixture
 * 
 * @param fileName - Name of the resource fixture file
 * @returns The resource fixture data
 */
export function loadResourceFixture(fileName: string): Resource {
  return loadFixture<Resource>(path.join('resources', fileName));
}

/**
 * Load a topic fixture
 * 
 * @param fileName - Name of the topic fixture file
 * @returns The topic fixture data
 */
export function loadTopicFixture(fileName: string): Topic {
  return loadFixture<Topic>(path.join('topics', fileName));
}

/**
 * Write a fixture to a temporary file
 * 
 * @param data - The data to write
 * @param relativePath - Path relative to the fixtures directory
 * @returns The absolute path to the written file
 */
export function writeFixture<T>(data: T, relativePath: string): string {
  const filePath = path.join(FIXTURES_DIR, relativePath);
  const dirPath = path.dirname(filePath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}
