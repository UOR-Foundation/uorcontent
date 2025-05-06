/**
 * Predicate Routes
 * 
 * This file defines the routes for predicate operations.
 * These routes handle operations specific to predicate content type.
 */

import { Router } from 'express';
import { predicateController } from '../controllers/predicate-controller';
import { validateContent } from '../middleware/validate-content';

const router = Router();

router.get('/', predicateController.getAllPredicates);

router.get('/:id', predicateController.getPredicateById);

router.post('/', validateContent, predicateController.createPredicate);

router.put('/:id', validateContent, predicateController.updatePredicate);

router.delete('/:id', predicateController.deletePredicate);

export const predicateRoutes = router;
