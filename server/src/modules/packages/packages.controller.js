import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as service from './packages.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listPublishedPackages(req.query);
  sendSuccess(res, { packages: items }, { meta });
});

export const filters = asyncHandler(async (_req, res) => {
  sendSuccess(res, await service.getPackageFilters());
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { package: await service.getPublishedPackageBySlug(req.params.slug) });
});
