/**
 * Relationship Routes
 * 
 * This file defines the routes for relationship operations.
 * These routes handle operations for managing relationships between content items.
 */

import { Router } from 'express';
import { relationshipController } from '../controllers/relationship-controller';
import { validateContent } from '../middleware/validate-content';

const router = Router();

router.post('/', validateContent, relationshipController.createRelationship);

router.get('/:id', relationshipController.getRelationship);

router.put('/:id', validateContent, relationshipController.updateRelationship);

router.delete('/:id', relationshipController.deleteRelationship);

router.get('/', relationshipController.listRelationships);

router.get('/graph', relationshipController.buildGraph);

router.get('/paths/:sourceId/:targetId', relationshipController.findPaths);

router.get('/validate', relationshipController.validateGraph);

router.get('/export', relationshipController.exportGraph);

export const relationshipRoutes = router;
