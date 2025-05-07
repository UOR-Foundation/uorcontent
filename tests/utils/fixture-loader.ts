/**
 * Test Fixture Loader
 * 
 * Utility for loading test fixtures from the fixtures directory.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Load a test fixture from the fixtures directory
 * 
 * @param type The type of fixture (e.g., 'concepts', 'predicates')
 * @param name The name of the fixture file without extension
 * @returns The fixture data
 */
export function loadFixture<T>(type: string, name: string): T {
  const fixturePath = path.join(__dirname, '..', 'fixtures', type, `${name}.json`);
  
  try {
    const fixtureData = fs.readFileSync(fixturePath, 'utf-8');
    return JSON.parse(fixtureData) as T;
  } catch (error) {
    throw new Error(`Failed to load fixture: ${type}/${name}.json - ${(error as Error).message}`);
  }
}

/**
 * Load all fixtures of a specific type from the fixtures directory
 * 
 * @param type The type of fixtures to load (e.g., 'concepts', 'predicates')
 * @returns An array of fixture data
 */
export function loadAllFixtures<T>(type: string): T[] {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', type);
  
  try {
    if (!fs.existsSync(fixturesDir)) {
      return [];
    }
    
    const fixtureFiles = fs.readdirSync(fixturesDir)
      .filter(file => file.endsWith('.json'));
    
    return fixtureFiles.map(file => {
      const fixtureData = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      return JSON.parse(fixtureData) as T;
    });
  } catch (error) {
    throw new Error(`Failed to load fixtures of type: ${type} - ${(error as Error).message}`);
  }
}

/**
 * Save a fixture to the fixtures directory
 * 
 * @param type The type of fixture (e.g., 'concepts', 'predicates')
 * @param name The name of the fixture file without extension
 * @param data The fixture data to save
 */
export function saveFixture<T>(type: string, name: string, data: T): void {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', type);
  
  try {
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    const fixturePath = path.join(fixturesDir, `${name}.json`);
    fs.writeFileSync(fixturePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save fixture: ${type}/${name}.json - ${(error as Error).message}`);
  }
}
