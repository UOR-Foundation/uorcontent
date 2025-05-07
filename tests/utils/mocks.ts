/**
 * Test Mocks
 * 
 * Mock implementations for external dependencies used in tests.
 */

import { EventEmitter } from 'events';

/**
 * Create a mock file system implementation
 */
export function createMockFileSystem() {
  const files: Record<string, string> = {};
  const directories: Record<string, boolean> = {};
  
  return {
    readFile: jest.fn((path: string) => {
      if (files[path]) {
        return Promise.resolve(files[path]);
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    }),
    
    readJsonFile: jest.fn(async <T>(path: string): Promise<T> => {
      const content = await Promise.resolve(files[path]);
      if (!content) {
        return Promise.reject(new Error(`File not found: ${path}`));
      }
      return JSON.parse(content) as T;
    }),
    
    writeFile: jest.fn((path: string, data: string) => {
      files[path] = data;
      return Promise.resolve();
    }),
    
    writeJsonFile: jest.fn(<T>(path: string, content: T) => {
      files[path] = JSON.stringify(content, null, 2);
      return Promise.resolve();
    }),
    
    fileExists: jest.fn((path: string) => {
      return Promise.resolve(files[path] !== undefined);
    }),
    
    createDirectory: jest.fn((path: string) => {
      directories[path] = true;
      return Promise.resolve();
    }),
    
    listDirectory: jest.fn((path: string) => {
      const result: string[] = [];
      
      Object.keys(files).forEach(filePath => {
        if (filePath.startsWith(path) && filePath.substring(path.length + 1).indexOf('/') === -1) {
          result.push(filePath.substring(path.length + 1));
        }
      });
      
      Object.keys(directories).forEach(dirPath => {
        if (dirPath.startsWith(path) && dirPath.substring(path.length + 1).indexOf('/') === -1) {
          result.push(dirPath.substring(path.length + 1));
        }
      });
      
      return Promise.resolve(result);
    }),
    
    deleteFile: jest.fn((path: string) => {
      if (files[path]) {
        delete files[path];
        return Promise.resolve();
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    }),
    
    deleteDirectory: jest.fn((path: string, recursive = false) => {
      if (directories[path]) {
        delete directories[path];
        return Promise.resolve();
      }
      return Promise.reject(new Error(`Directory not found: ${path}`));
    }),
    
    _setFile: (path: string, content: string) => {
      files[path] = content;
    },
    
    _setDirectory: (path: string) => {
      directories[path] = true;
    },
    
    _reset: () => {
      Object.keys(files).forEach(key => delete files[key]);
      Object.keys(directories).forEach(key => delete directories[key]);
    }
  };
}

/**
 * Create a mock schema validator implementation
 */
export function createMockSchemaValidator() {
  return {
    initialize: jest.fn(() => Promise.resolve()),
    
    validateContent: jest.fn((content: any) => {
      return { valid: true, errors: [] as string[] };
    }),
    
    validateConcept: jest.fn((concept: any) => {
      return { valid: true, errors: [] as string[] };
    }),
    
    validatePredicate: jest.fn((predicate: any) => {
      return { valid: true, errors: [] as string[] };
    }),
    
    validateResource: jest.fn((resource: any) => {
      return { valid: true, errors: [] as string[] };
    }),
    
    validateTopic: jest.fn((topic: any) => {
      return { valid: true, errors: [] as string[] };
    }),
    
    validatePartial: jest.fn((content: any, type: string) => {
      return { valid: true, errors: [] as string[] };
    }),
    
    isInitialized: true
  };
}

/**
 * Create a mock event emitter
 */
export function createMockEventEmitter() {
  const emitter = new EventEmitter();
  const emit = jest.spyOn(emitter, 'emit');
  const on = jest.spyOn(emitter, 'on');
  
  return {
    emitter,
    emit,
    on
  };
}

/**
 * Create a mock HTTP response
 */
export function createMockResponse() {
  const res: any = {};
  
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  
  return res;
}

/**
 * Create a mock HTTP request
 */
export function createMockRequest(options: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
} = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {}
  };
}
