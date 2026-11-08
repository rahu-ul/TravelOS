import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { listStoriesQuery } from './stories.validation.js';
import * as service from './stories.service.js';

// Public, read-only. Mounted at /api/stories.
export const storiesRouter = Router();

storiesRouter.get(
  '/',
  validate({ query: listStoriesQuery }),
  asyncHandler(async (req, res) => {
    const { items, meta } = await service.listPublishedStories(req.query);
    sendSuccess(res, { stories: items }, { meta });
  })
);

storiesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    sendSuccess(res, { story: await service.getPublishedStoryBySlug(req.params.slug) });
  })
);
