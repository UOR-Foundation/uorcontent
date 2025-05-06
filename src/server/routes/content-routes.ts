/**
 * Content Routes
 * 
 * This file defines the routes for general content operations.
 * These routes handle operations that apply to all content types.
 */

import { Router } from 'express';
import { contentController } from '../controllers/content-controller';
import { validateContent } from '../middleware/validate-content';

const router = Router();

router.get('/', contentController.getAllContent);

router.get('/:id', contentController.getContentById);

router.post('/', validateContent, contentController.createContent);

router.put('/:id', validateContent, contentController.updateContent);

router.delete('/:id', contentController.deleteContent);

export const contentRoutes = router;
