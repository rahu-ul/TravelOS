import mongoose from 'mongoose';
import { Package } from './package.model.js';
import { PackageVersion } from './packageVersion.model.js';
import { activityService } from '../activity/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { SLUG_REGEX } from '../../config/constants.js';
import { buildItem, toDetail } from './packageCatalogue.js';

/**
 * Validate that no seasonal date periods overlap with each other.
 * This is a strict business requirement so that price lookup is deterministic.
 */
export function validateSeasonalPeriods(seasons = []) {
  for (let i = 0; i < seasons.length; i++) {
    const s1 = seasons[i];
    const start1 = new Date(s1.startDate).getTime();
    const end1 = new Date(s1.endDate).getTime();
    if (Number.isNaN(start1) || Number.isNaN(end1)) {
      throw ApiError.badRequest(`Season "${s1.name || i + 1}" has invalid dates`);
    }
    if (end1 < start1) {
      throw ApiError.badRequest(`Season "${s1.name || i + 1}": end date must be on or after start date`);
    }
    if (s1.pricePerPerson !== undefined && s1.pricePerPerson !== null) {
      if (!Number.isInteger(s1.pricePerPerson) || s1.pricePerPerson < 0) {
        throw ApiError.badRequest(`Season "${s1.name || i + 1}": price must be a non-negative integer`);
      }
    }

    for (let j = i + 1; j < seasons.length; j++) {
      const s2 = seasons[j];
      const start2 = new Date(s2.startDate).getTime();
      const end2 = new Date(s2.endDate).getTime();
      if (start1 <= end2 && end1 >= start2) {
        throw ApiError.badRequest(
          `Overlapping season dates detected between "${s1.name || 'Season ' + (i + 1)}" and "${s2.name || 'Season ' + (j + 1)}"`
        );
      }
    }
  }
}

/**
 * List all packages for the admin CMS (both published and drafts)
 */
export async function listAdminPackages() {
  const packages = await Package.find()
    .populate('publishedVersionId')
    .populate('draftVersionId')
    .sort({ updatedAt: -1 })
    .lean();

  return packages.map((pkg) => {
    const activeVersion = pkg.draftVersionId || pkg.publishedVersionId;
    return {
      id: String(pkg._id),
      code: pkg.code,
      slug: pkg.slug,
      name: pkg.listing?.name || activeVersion?.content?.name || 'Untitled Package',
      destination: pkg.listing?.destination || activeVersion?.content?.destination || null,
      hotelCategory: pkg.listing?.category || activeVersion?.content?.hotelCategory || null,
      durationDays: pkg.listing?.durationDays || activeVersion?.content?.durationDays || null,
      startingPrice: pkg.listing?.startingPrice ?? (activeVersion?.seasons?.length ? Math.min(...activeVersion.seasons.map(s => s.pricePerPerson)) : null),
      isPublished: Boolean(pkg.publishedVersionId),
      hasDraft: Boolean(pkg.draftVersionId),
      publishedVersionNumber: pkg.publishedVersionId?.versionNumber ?? null,
      draftVersionNumber: pkg.draftVersionId?.versionNumber ?? null,
      isDemo: Boolean(pkg.isDemo),
      updatedAt: pkg.updatedAt,
      createdAt: pkg.createdAt,
    };
  });
}

/**
 * Get package details with draft and published versions for CMS editing
 */
export async function getAdminPackageById(packageId) {
  const pkg = await Package.findById(packageId).lean();
  if (!pkg) throw ApiError.notFound('Package not found');

  const draft = pkg.draftVersionId ? await PackageVersion.findById(pkg.draftVersionId).lean() : null;
  const published = pkg.publishedVersionId ? await PackageVersion.findById(pkg.publishedVersionId).lean() : null;
  const history = await PackageVersion.find({ packageId: pkg._id })
    .select('versionNumber status revision changeNote publishedAt publishedBy createdBy createdAt restoredFromVersionId')
    .sort({ versionNumber: -1 })
    .lean();

  return {
    package: pkg,
    draft,
    published,
    history,
  };
}

/**
 * Create a new package with initial draft version
 */
export async function createPackage(input, user) {
  const { code, slug, content = {}, seasons = [] } = input;

  if (!code || !/^PKG-[A-Z]{2}-\d{2}$/.test(code)) {
    throw ApiError.badRequest('Package code is required and must follow PKG-XX-00 format');
  }
  if (!slug || !SLUG_REGEX.test(slug)) {
    throw ApiError.badRequest('Valid slug is required (lowercase letters, numbers, hyphens)');
  }
  if (!content.name) {
    throw ApiError.badRequest('Package name is required');
  }

  const existingCode = await Package.findOne({ code });
  if (existingCode) throw ApiError.badRequest(`Package code ${code} is already in use`);

  const existingSlug = await Package.findOne({ slug });
  if (existingSlug) throw ApiError.badRequest(`Slug ${slug} is already in use`);

  validateSeasonalPeriods(seasons);

  const pkg = new Package({
    code,
    slug,
    isDemo: Boolean(input.isDemo),
    createdBy: user._id,
  });

  const version = new PackageVersion({
    packageId: pkg._id,
    versionNumber: 1,
    status: 'draft',
    revision: 0,
    content: {
      name: content.name,
      destination: content.destination || '',
      category: content.category || content.destination || 'General',
      durationDays: content.durationDays || 3,
      nights: content.nights || (content.durationDays ? Math.max(0, content.durationDays - 1) : 2),
      hotelCategory: content.hotelCategory || '4-star',
      summary: content.summary || '',
      description: content.description || '',
      itinerary: content.itinerary || [],
      hotels: content.hotels || [],
      inclusions: content.inclusions || [],
      exclusions: content.exclusions || [],
      heroImage: content.heroImage || { url: '/images/seed/kerala-houseboat.jpg', alt: content.name },
      gallery: content.gallery || [],
      location: content.location || { label: content.destination || 'Kerala' },
      seo: content.seo || { title: content.name, description: content.summary || '' },
    },
    seasons,
    changeNote: 'Initial draft created',
    createdBy: user._id,
  });

  await version.save();
  pkg.draftVersionId = version._id;
  await pkg.save();

  await activityService.log({
    actorId: user._id,
    action: 'package.created',
    entityType: 'package',
    entityId: pkg._id,
    metadata: { code, slug },
  });

  return { package: pkg, version };
}

/**
 * Save or update the active draft for a package
 */
export async function updateDraft(packageId, input, user) {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw ApiError.notFound('Package not found');

  let draft;
  if (pkg.draftVersionId) {
    draft = await PackageVersion.findOne({ _id: pkg.draftVersionId, status: 'draft' });
  }

  // If there's no active draft, create a new draft cloned from the published version
  if (!draft) {
    if (!pkg.publishedVersionId) {
      throw ApiError.badRequest('No version exists to update');
    }
    const published = await PackageVersion.findById(pkg.publishedVersionId).lean();
    if (!published) throw ApiError.badRequest('Published version not found');

    const highestVersion = await PackageVersion.findOne({ packageId: pkg._id }).sort({ versionNumber: -1 }).select('versionNumber').lean();
    const nextVersionNumber = (highestVersion?.versionNumber || 1) + 1;

    draft = new PackageVersion({
      packageId: pkg._id,
      versionNumber: nextVersionNumber,
      status: 'draft',
      revision: 0,
      content: published.content,
      seasons: published.seasons,
      changeNote: input.changeNote || 'New draft created from published version',
      createdBy: user._id,
    });
    await draft.save();
    pkg.draftVersionId = draft._id;
    await pkg.save();
  }

  // Optimistic concurrency check
  if (input.revision !== undefined && input.revision !== null) {
    if (draft.revision !== input.revision) {
      throw ApiError.conflict('Another editor has modified this draft. Please reload the latest draft.');
    }
  }

  if (input.seasons) {
    validateSeasonalPeriods(input.seasons);
    draft.seasons = input.seasons;
  }

  if (input.content) {
    draft.content = {
      ...draft.content.toObject(),
      ...input.content,
    };
  }

  if (input.changeNote) {
    draft.changeNote = input.changeNote;
  }

  draft.revision = (draft.revision || 0) + 1;
  await draft.save();

  await activityService.log({
    actorId: user._id,
    action: 'package.updated',
    entityType: 'package',
    entityId: pkg._id,
    metadata: { versionNumber: draft.versionNumber, revision: draft.revision },
  });

  return draft;
}

/**
 * Publish the active draft of a package
 */
export async function publishPackage(packageId, user, changeNote = 'Published via CMS') {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw ApiError.notFound('Package not found');

  if (!pkg.draftVersionId) {
    throw ApiError.badRequest('No active draft to publish');
  }

  const draft = await PackageVersion.findOne({ _id: pkg.draftVersionId, status: 'draft' });
  if (!draft) throw ApiError.badRequest('Draft version not found');

  // Validate draft before publishing
  if (!draft.content?.name) throw ApiError.badRequest('Draft must have a name');
  if (!draft.content?.destination) throw ApiError.badRequest('Draft must have a destination');
  validateSeasonalPeriods(draft.seasons);

  // Transition draft to published
  draft.status = 'published';
  draft.publishedAt = new Date();
  draft.publishedBy = user._id;
  draft.changeNote = changeNote;
  draft.$locals.publishing = true;
  await draft.save();

  // Compute starting price
  const validPrices = draft.seasons.map(s => s.pricePerPerson).filter(p => Number.isFinite(p) && p >= 0);
  const startingPrice = validPrices.length ? Math.min(...validPrices) : null;

  // Update Package pointer and listing projection
  pkg.publishedVersionId = draft._id;
  pkg.draftVersionId = null;
  pkg.listing = {
    name: draft.content.name,
    destination: draft.content.destination,
    category: draft.content.category || draft.content.destination,
    durationDays: draft.content.durationDays,
    nights: draft.content.nights,
    heroImage: draft.content.heroImage,
    startingPrice,
    currency: 'INR',
    summary: draft.content.summary,
  };

  await pkg.save();

  await activityService.log({
    actorId: user._id,
    action: 'package.published',
    entityType: 'package',
    entityId: pkg._id,
    metadata: { versionNumber: draft.versionNumber, startingPrice },
  });

  return { package: pkg, publishedVersion: draft };
}

/**
 * Duplicate an existing package into a new draft package
 */
export async function duplicatePackage(packageId, user) {
  const source = await Package.findById(packageId);
  if (!source) throw ApiError.notFound('Package not found');

  const sourceVersion = await PackageVersion.findById(source.draftVersionId || source.publishedVersionId).lean();
  if (!sourceVersion) throw ApiError.badRequest('Source package has no valid version to duplicate');

  // Generate new code and slug
  const count = await Package.countDocuments();
  const code = `PKG-KL-${String(count + 1).padStart(2, '0')}`;
  const slug = `${source.slug}-copy-${Date.now().toString(36)}`;

  const newPkg = new Package({
    code,
    slug,
    isDemo: false,
    createdBy: user._id,
  });

  const newVersion = new PackageVersion({
    packageId: newPkg._id,
    versionNumber: 1,
    status: 'draft',
    revision: 0,
    content: {
      ...sourceVersion.content,
      name: `${sourceVersion.content.name} (Copy)`,
    },
    seasons: sourceVersion.seasons || [],
    changeNote: `Duplicated from ${source.code}`,
    createdBy: user._id,
  });

  await newVersion.save();
  newPkg.draftVersionId = newVersion._id;
  await newPkg.save();

  await activityService.log({
    actorId: user._id,
    action: 'package.duplicated',
    entityType: 'package',
    entityId: newPkg._id,
    metadata: { sourcePackageId: source._id, newCode: code },
  });

  return { package: newPkg, version: newVersion };
}

/**
 * Restore an older version into a brand new draft
 */
export async function restoreVersion(packageId, targetVersionId, user) {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw ApiError.notFound('Package not found');

  const target = await PackageVersion.findOne({ _id: targetVersionId, packageId: pkg._id }).lean();
  if (!target) throw ApiError.notFound('Target version to restore not found');

  // If there's already an active draft, we replace it or increment versionNumber
  if (pkg.draftVersionId) {
    // Delete existing active draft so one_draft_per_package index is satisfied
    await PackageVersion.deleteOne({ _id: pkg.draftVersionId, status: 'draft' });
  }

  const highestVersion = await PackageVersion.findOne({ packageId: pkg._id }).sort({ versionNumber: -1 }).select('versionNumber').lean();
  const nextVersionNumber = (highestVersion?.versionNumber || 1) + 1;

  const newDraft = new PackageVersion({
    packageId: pkg._id,
    versionNumber: nextVersionNumber,
    status: 'draft',
    revision: 0,
    content: target.content,
    seasons: target.seasons,
    restoredFromVersionId: target._id,
    changeNote: `Restored from version ${target.versionNumber}`,
    createdBy: user._id,
  });

  await newDraft.save();
  pkg.draftVersionId = newDraft._id;
  await pkg.save();

  await activityService.log({
    actorId: user._id,
    action: 'package.restored',
    entityType: 'package',
    entityId: pkg._id,
    metadata: { restoredFromVersionNumber: target.versionNumber, newVersionNumber },
  });

  return newDraft;
}

/**
 * Safely preview the draft version of a package without exposing it publicly
 */
export async function previewDraft(packageId) {
  const pkg = await Package.findById(packageId).lean();
  if (!pkg) throw ApiError.notFound('Package not found');

  const version = pkg.draftVersionId
    ? await PackageVersion.findById(pkg.draftVersionId).lean()
    : await PackageVersion.findById(pkg.publishedVersionId).lean();

  if (!version) throw ApiError.notFound('No version available to preview');

  const item = buildItem(pkg, version);
  return toDetail(item, []);
}

