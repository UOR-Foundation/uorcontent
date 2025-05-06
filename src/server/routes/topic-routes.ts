/**
 * Topic Routes
 * 
 * This file defines the routes for topic operations.
 * These routes handle operations specific to topic content type.
 */

import { Router } from 'express';
import { topicController } from '../controllers/topic-controller';
import { validateContent } from '../middleware/validate-content';

const router = Router();

router.get('/', topicController.getAllTopics);

router.get('/:id', topicController.getTopicById);

router.post('/', validateContent, topicController.createTopic);

router.put('/:id', validateContent, topicController.updateTopic);

router.delete('/:id', topicController.deleteTopic);

export const topicRoutes = router;
