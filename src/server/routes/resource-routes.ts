/**
 * Resource Routes
 * 
 * This file defines the routes for resource operations.
 * These routes handle operations specific to resource content type.
 */

import { Router } from 'express';
import { resourceController } from '../controllers/resource-controller';
import { validateContent } from '../middleware/validate-content';

const router = Router();

router.get('/', resourceController.getAllResources);

router.get('/:id', resourceController.getResourceById);

router.post('/', validateContent, resourceController.createResource);

router.put('/:id', validateContent, resourceController.updateResource);

router.delete('/:id', resourceController.deleteResource);

export const resourceRoutes = router;
