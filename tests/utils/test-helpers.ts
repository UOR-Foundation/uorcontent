/**
 * Test Helpers
 * 
 * Helper functions for common test operations.
 */

import { EventEmitter } from 'events';
import * as path from 'path';

/**
 * Create a test environment with temporary directories
 */
export function setupTestEnvironment() {
  process.env.UOR_CONTENT_DIR = path.join(__dirname, '..', 'fixtures', 'temp');
  process.env.UOR_TEST_MODE = 'true';
  
  return {
    contentDir: process.env.UOR_CONTENT_DIR,
    cleanup: () => {
      delete process.env.UOR_CONTENT_DIR;
      delete process.env.UOR_TEST_MODE;
    }
  };
}

/**
 * Create a test event bus
 */
export function createTestEventBus() {
  const eventBus = new EventEmitter();
  const events: Array<{ event: string, data: any }> = [];
  
  return {
    eventBus,
    events,
    subscribe: () => {
      eventBus.removeAllListeners();
      
      const eventNames = eventBus.eventNames();
      eventNames.forEach(name => {
        eventBus.on(name as string, (data: any) => {
          events.push({ event: name as string, data });
        });
      });
    },
    reset: () => {
      eventBus.removeAllListeners();
      events.length = 0;
    }
  };
}

/**
 * Wait for a specified amount of time
 * 
 * @param ms Time to wait in milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random identifier for testing
 * 
 * @param prefix Prefix for the identifier
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a deep copy of an object
 * 
 * @param obj Object to copy
 */
export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a mock function that resolves after a delay
 * 
 * @param result Result to resolve with
 * @param delay Delay in milliseconds
 */
export function createDelayedMock<T>(result: T, delay: number = 10): jest.Mock {
  return jest.fn().mockImplementation(() => {
    return new Promise<T>(resolve => {
      setTimeout(() => resolve(result), delay);
    });
  });
}

/**
 * Create a mock function that rejects after a delay
 * 
 * @param error Error to reject with
 * @param delay Delay in milliseconds
 */
export function createDelayedErrorMock(error: Error, delay: number = 10): jest.Mock {
  return jest.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(error), delay);
    });
  });
}
