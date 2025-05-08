/**
 * Error Handler Middleware
 * 
 * This middleware handles errors that occur during request processing.
 * It formats error responses according to the MCP protocol and logs
 * errors for debugging purposes.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, AuthorizationError } from '../types/errors';

/**
 * Error handler middleware
 * 
 * Handles errors that occur during request processing
 * 
 * @param error - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error(`Error processing request: ${error.message}`, {
    path: req.path,
    method: req.method,
    error: error.stack
  });

  if (error instanceof ValidationError) {
    res.status(400).json({
      error: {
        code: 400,
        message: error.message,
        data: error.details
      }
    });
  } else if (error instanceof NotFoundError) {
    res.status(404).json({
      error: {
        code: 404,
        message: error.message
      }
    });
  } else if (error instanceof AuthorizationError) {
    res.status(403).json({
      error: {
        code: 403,
        message: error.message
      }
    });
  } else {
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
};
