import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { listPackagesQuery } from './packages.validation.js';
import * as controller from './packages.controller.js';

// Public, read-only. Mounted at /api/packages. "/filters" must stay above "/:slug".
export const packagesRouter = Router();
packagesRouter.get('/', validate({ query: listPackagesQuery }), controller.list);
packagesRouter.get('/filters', controller.filters);
packagesRouter.get('/:slug', controller.detail);
