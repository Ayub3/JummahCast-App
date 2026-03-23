import express from 'express';
import { validateRequest, schemas } from '../middleware/validator.js';

/**
 * Sermon Routes
 * Public endpoints for sermon browsing
 */
export function createSermonRoutes(sermonController) {
  const router = express.Router();

  router.get(
    '/',
    validateRequest(schemas.sermon.list),
    sermonController.listSermons
  );

  router.get(
    '/:id/stream',
    validateRequest(schemas.sermon.get),
    sermonController.streamSermon
  );

  return router;
}

/**
 * Speaker Routes
 */
export function createSpeakerRoutes(sermonController) {
  const router = express.Router();
  router.get('/', sermonController.listSpeakers);
  return router;
}

/**
 * Mosque Routes
 */
export function createMosqueRoutes(sermonController) {
  const router = express.Router();
  router.get('/', sermonController.listMosques);
  return router;
}
