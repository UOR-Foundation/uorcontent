/**
 * Test Helpers
 * 
 * This file contains helper functions for setting up test environments.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Setup a test environment with a temporary content directory
 * 
 * @returns Object containing the content directory path and cleanup function
 */
export function setupTestEnvironment() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uor-content-test-'));
  const contentDir = path.join(tempDir, 'content');
  
  const dirs = [
    path.join(contentDir, 'concepts'),
    path.join(contentDir, 'predicates'),
    path.join(contentDir, 'resources'),
    path.join(contentDir, 'topics'),
    path.join(contentDir, 'indexes')
  ];
  
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return {
    contentDir,
    cleanup: () => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error(`Error cleaning up test environment: ${error}`);
      }
    }
  };
}

/**
 * Create a test file with the given content
 * 
 * @param filePath - Path to the file to create
 * @param content - Content to write to the file
 */
export function createTestFile(filePath: string, content: unknown) {
  const dirPath = path.dirname(filePath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  if (typeof content === 'object') {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
  } else {
    fs.writeFileSync(filePath, String(content), 'utf-8');
  }
}

/**
 * Wait for a specified amount of time
 * 
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random ID for test entities
 * 
 * @param prefix - Prefix for the ID
 * @returns Random ID with the specified prefix
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
}
