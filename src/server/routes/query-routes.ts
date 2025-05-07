/**
 * Query Routes
 * 
 * This file defines the routes for query operations.
 * These routes handle operations for querying content with filtering,
 * searching, and pagination capabilities.
 * 
 * Implementation for Issue #6: Query Operations with pluggable providers
 */

import { Router } from 'express';
import { queryController } from '../controllers/query-controller';

const router = Router();

router.post('/filter', queryController.filterContent);

router.get('/search', queryController.searchContent);

router.post('/paginate', queryController.paginateContent);

router.post('/sort', queryController.sortContent);

router.post('/', queryController.executeQuery);

export const queryRoutes = router;
