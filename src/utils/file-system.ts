/**
 * File System Utilities for UOR Content Management Client
 * Provides abstraction layer for file operations with proper error handling
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Error types for file system operations
 */
export class FileSystemError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export class FileNotFoundError extends FileSystemError {
  constructor(filePath: string, cause?: Error) {
    super(`File not found: ${filePath}`, cause);
    this.name = 'FileNotFoundError';
  }
}

export class FileReadError extends FileSystemError {
  constructor(filePath: string, cause?: Error) {
    super(`Error reading file: ${filePath}`, cause);
    this.name = 'FileReadError';
  }
}

export class FileWriteError extends FileSystemError {
  constructor(filePath: string, cause?: Error) {
    super(`Error writing file: ${filePath}`, cause);
    this.name = 'FileWriteError';
  }
}

export class DirectoryError extends FileSystemError {
  constructor(dirPath: string, cause?: Error) {
    super(`Error with directory: ${dirPath}`, cause);
    this.name = 'DirectoryError';
  }
}

/**
 * Interface for file system operations
 * Allows for mocking in tests
 */
export interface FileSystem {
  readFile(filePath: string): Promise<string>;
  readJsonFile<T>(filePath: string): Promise<T>;
  writeFile(filePath: string, content: string): Promise<void>;
  writeJsonFile<T>(filePath: string, content: T): Promise<void>;
  fileExists(filePath: string): Promise<boolean>;
  createDirectory(dirPath: string): Promise<void>;
  listDirectory(dirPath: string): Promise<string[]>;
  deleteFile(filePath: string): Promise<void>;
  deleteDirectory(dirPath: string, recursive?: boolean): Promise<void>;
}

/**
 * Implementation of FileSystem interface using Node.js fs/promises
 */
export class NodeFileSystem implements FileSystem {
  /**
   * Read a file as string
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new FileNotFoundError(filePath, error);
        }
        throw new FileReadError(filePath, error);
      }
      throw new FileReadError(filePath, new Error(String(error)));
    }
  }

  /**
   * Read and parse a JSON file
   */
  async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content) as T;
    } catch (error: unknown) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new FileReadError(filePath, error);
      }
      throw new FileReadError(filePath, new Error(String(error)));
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await this.createDirectory(path.dirname(filePath));
      
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, content, 'utf-8');
      
      await fs.rename(tempPath, filePath);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FileWriteError(filePath, error);
      }
      throw new FileWriteError(filePath, new Error(String(error)));
    }
  }

  /**
   * Write object as JSON to a file
   */
  async writeJsonFile<T>(filePath: string, content: T): Promise<void> {
    try {
      const jsonContent = JSON.stringify(content, null, 2);
      await this.writeFile(filePath, jsonContent);
    } catch (error: unknown) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new FileWriteError(filePath, error);
      }
      throw new FileWriteError(filePath, new Error(String(error)));
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a directory if it doesn't exist
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DirectoryError(dirPath, error);
      }
      throw new DirectoryError(dirPath, new Error(String(error)));
    }
  }

  /**
   * List files in a directory
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DirectoryError(dirPath, error);
      }
      throw new DirectoryError(dirPath, new Error(String(error)));
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      if (error instanceof Error) {
        throw new FileWriteError(filePath, error);
      }
      throw new FileWriteError(filePath, new Error(String(error)));
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(dirPath: string, recursive = false): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive, force: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DirectoryError(dirPath, error);
      }
      throw new DirectoryError(dirPath, new Error(String(error)));
    }
  }
}

/**
 * Content path utilities
 */
export class ContentPathResolver {
  constructor(private readonly basePath: string) {}

  /**
   * Get path for a concept file
   */
  getConceptPath(id: string): string {
    return path.join(this.basePath, 'concepts', `UOR-C-${id}.json`);
  }

  /**
   * Get path for a resource file
   */
  getResourcePath(id: string): string {
    return path.join(this.basePath, 'resources', `UOR-R-${id}.json`);
  }

  /**
   * Get path for a topic file
   */
  getTopicPath(id: string): string {
    return path.join(this.basePath, 'topics', `UOR-T-${id}.json`);
  }

  /**
   * Get path for a predicate file
   */
  getPredicatePath(id: string): string {
    return path.join(this.basePath, 'predicates', `UOR-P-${id}.json`);
  }

  /**
   * Get path for the main index file
   */
  getIndexPath(): string {
    return path.join(this.basePath, 'index.json');
  }

  /**
   * Get path for a specific index file
   */
  getTypeIndexPath(type: 'concepts' | 'resources' | 'topics' | 'predicates'): string {
    return path.join(this.basePath, `${type}-index.json`);
  }
}

/**
 * Mock file system for testing
 */
export class MockFileSystem implements FileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  constructor() {
    this.directories.add('/');
  }

  async readFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      throw new FileNotFoundError(filePath);
    }
    return content;
  }

  async readJsonFile<T>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    try {
      return JSON.parse(content) as T;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FileReadError(filePath, error);
      }
      throw new FileReadError(filePath, new Error(String(error)));
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const dirPath = path.dirname(filePath);
    if (!this.directories.has(dirPath)) {
      await this.createDirectory(dirPath);
    }
    this.files.set(filePath, content);
  }

  async writeJsonFile<T>(filePath: string, content: T): Promise<void> {
    const jsonContent = JSON.stringify(content, null, 2);
    await this.writeFile(filePath, jsonContent);
  }

  async fileExists(filePath: string): Promise<boolean> {
    return this.files.has(filePath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    this.directories.add(dirPath);
    
    const parentDir = path.dirname(dirPath);
    if (parentDir !== dirPath && !this.directories.has(parentDir)) {
      await this.createDirectory(parentDir);
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    if (!this.directories.has(dirPath)) {
      throw new DirectoryError(dirPath);
    }
    
    const result: string[] = [];
    for (const filePath of this.files.keys()) {
      if (path.dirname(filePath) === dirPath) {
        result.push(path.basename(filePath));
      }
    }
    return result;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.files.has(filePath)) {
      throw new FileNotFoundError(filePath);
    }
    this.files.delete(filePath);
  }

  async deleteDirectory(dirPath: string, recursive = false): Promise<void> {
    if (!this.directories.has(dirPath)) {
      throw new DirectoryError(dirPath);
    }
    
    if (recursive) {
      for (const filePath of [...this.files.keys()]) {
        if (filePath.startsWith(dirPath + path.sep) || filePath === dirPath) {
          this.files.delete(filePath);
        }
      }
      
      for (const dir of [...this.directories]) {
        if (dir.startsWith(dirPath + path.sep) || dir === dirPath) {
          this.directories.delete(dir);
        }
      }
    } else {
      for (const filePath of this.files.keys()) {
        if (path.dirname(filePath) === dirPath) {
          throw new DirectoryError(`Directory not empty: ${dirPath}`);
        }
      }
      
      for (const dir of this.directories) {
        if (path.dirname(dir) === dirPath) {
          throw new DirectoryError(`Directory not empty: ${dirPath}`);
        }
      }
      
      this.directories.delete(dirPath);
    }
  }

  reset(): void {
    this.files.clear();
    this.directories.clear();
    this.directories.add('/');
  }
}
