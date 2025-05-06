/**
 * Index Routes
 * 
 * This file defines the routes for index management operations.
 * These routes handle operations for generating, updating, validating,
 * repairing, and querying indexes.
 * 
 * Implementation for Issue #7: Index Management with incremental updates
 */

import { Router } from 'express';
import { indexController } from '../controllers/index-controller';

const router = Router();

router.post('/:contentType/generate', indexController.generateIndex);

router.post('/:contentType/:id/update', indexController.updateIndex);

router.get('/:contentType/validate', indexController.validateIndex);

router.post('/:contentType/repair', indexController.repairIndex);

router.post('/:contentType/query', indexController.queryIndex);

router.post('/cache/invalidate/:contentType?', indexController.invalidateCache);

export const indexRoutes = router;
