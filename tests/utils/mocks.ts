/**
 * Mocks
 * 
 * This file contains mock implementations for testing.
 */

import { ValidationResult, ValidationError } from '../../src/utils/schema-validation';


/**
 * Create a mock file system for testing
 * 
 * @returns Mock file system implementation
 */
export function createMockFileSystem() {
  return {
    readFile: jest.fn(),
    readJsonFile: jest.fn(),
    writeFile: jest.fn(),
    writeJsonFile: jest.fn(),
    fileExists: jest.fn(),
    createDirectory: jest.fn(),
    listDirectory: jest.fn(),
    deleteFile: jest.fn(),
    deleteDirectory: jest.fn()
  };
}

/**
 * Create a mock schema validator for testing
 * 
 * @returns Mock schema validator implementation
 */
export function createMockSchemaValidator() {
  return {
    validateContent: jest.fn(),
    validateConcept: jest.fn(),
    validatePredicate: jest.fn(),
    validateResource: jest.fn(),
    validateTopic: jest.fn(),
    validatePartial: jest.fn()
  };
}

/**
 * Create a mock event emitter for testing
 * 
 * @returns Mock event emitter implementation
 */
export function createMockEventEmitter() {
  const listeners: Record<string, Array<((...args: unknown[]) => void)>> = {};
  
  return {
    addEventListener: jest.fn((event: string, listener: (...args: unknown[]) => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
    }),
    
    removeEventListener: jest.fn((event: string, listener: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(listener);
        if (index !== -1) {
          listeners[event].splice(index, 1);
        }
      }
    }),
    
    emit: jest.fn((event: string, ...args: unknown[]) => {
      if (listeners[event]) {
        for (const listener of listeners[event]) {
          listener(...args);
        }
      }
    }),
    
    getListeners: jest.fn((event: string) => {
      return listeners[event] || [];
    })
  };
}

/**
 * Create a mock HTTP request for testing
 * 
 * @param options - Request options
 * @returns Mock request object
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    get: jest.fn((name: string) => {
      return (options.headers || {})[name];
    })
  };
}

/**
 * Create a mock HTTP response for testing
 * 
 * @returns Mock response object with jest functions
 */
export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    locals: {},
    headersSent: false
  };
  
  return res;
}

/**
 * Create a mock content repository for testing
 * 
 * @returns Mock content repository implementation
 */
export function createMockContentRepository() {
  return {
    getContentPath: jest.fn(),
    getContentFilePath: jest.fn(),
    listContentFiles: jest.fn(),
    readContentFile: jest.fn(),
    writeContentFile: jest.fn(),
    deleteContentFile: jest.fn(),
    contentFileExists: jest.fn()
  };
}

/**
 * Create a successful validation result
 * 
 * @returns Valid validation result
 */
export function createValidValidationResult(): ValidationResult {
  return { valid: true, errors: [] };
}

/**
 * Create a failed validation result
 * 
 * @param messages - Error messages
 * @returns Invalid validation result
 */
export function createInvalidValidationResult(messages: string[]): ValidationResult {
  const errors: ValidationError[] = messages.map(message => ({
    path: '/',
    message
  }));
  
  return { valid: false, errors };
}
