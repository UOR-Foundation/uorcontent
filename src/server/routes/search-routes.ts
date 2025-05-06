/**
 * Search Routes
 * 
 * This file defines the routes for search operations.
 * These routes handle search operations across all content types.
 */

import { Router } from 'express';
import { searchController } from '../controllers/search-controller';

const router = Router();

router.get('/', searchController.search);

router.get('/advanced', searchController.advancedSearch);

router.get('/by-type/:type', searchController.searchByType);

router.get('/by-property', searchController.searchByProperty);

export const searchRoutes = router;
