/**
 * Content Validation Middleware
 * 
 * This middleware validates content objects against Schema.org and UOR-specific schemas.
 * It ensures that all content mutations conform to the expected structure and
 * contain valid properties for the content type.
 */

import { Request, Response, NextFunction } from 'express';
import { ContentSchemaValidator } from '../utils/content-schema-validator';
import { ValidationError } from '../types/errors';

/**
 * Validate content middleware
 * 
 * Validates content objects against Schema.org and UOR-specific schemas
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const pathParts = req.path.split('/').filter(Boolean);
    let contentType = pathParts[0]; // e.g., 'concepts', 'predicates', etc.
    
    if (contentType.endsWith('s')) {
      contentType = contentType.slice(0, -1);
    }
    
    const validator = ContentSchemaValidator.getInstance();
    const validationResult = await validator.validateContent(
      contentType,
      req.body
    );

    if (!validationResult.valid) {
      throw new ValidationError(
        `Invalid ${contentType} content`,
        (validationResult.errors || []).map(error => error as unknown as Record<string, unknown>)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
