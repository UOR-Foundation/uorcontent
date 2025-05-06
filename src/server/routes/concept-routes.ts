/**
 * Concept Routes
 * 
 * This file defines the routes for concept operations.
 * These routes handle operations specific to concept content type.
 */

import { Router } from 'express';
import { conceptController } from '../controllers/concept-controller';
import { validateContent } from '../middleware/validate-content';

const router = Router();

router.get('/', conceptController.getAllConcepts);

router.get('/:id', conceptController.getConceptById);

router.post('/', validateContent, conceptController.createConcept);

router.put('/:id', validateContent, conceptController.updateConcept);

router.delete('/:id', conceptController.deleteConcept);

export const conceptRoutes = router;
