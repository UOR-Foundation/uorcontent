/**
 * Error Types
 * 
 * This file defines custom error types used throughout the MCP server.
 * These error types provide structured error information for the error handler.
 */

/**
 * Base error class for MCP server errors
 */
export class MCPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 * 
 * Used when request or content validation fails
 */
export class ValidationError extends MCPError {
  public details: any[];

  constructor(message: string, details: any[] = []) {
    super(message);
    this.details = details;
  }
}

/**
 * Not found error
 * 
 * Used when a requested resource is not found
 */
export class NotFoundError extends MCPError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Authorization error
 * 
 * Used when a request is not authorized
 */
export class AuthorizationError extends MCPError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * File system error
 * 
 * Used when a file system operation fails
 */
export class FileSystemError extends MCPError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Schema error
 * 
 * Used when a schema operation fails
 */
export class SchemaError extends MCPError {
  constructor(message: string) {
    super(message);
  }
}
