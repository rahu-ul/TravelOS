import { Package } from './package.model.js';
import { PackageVersion } from './packageVersion.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { SLUG_REGEX } from '../../config/constants.js';
import { applyFilters, buildFacets, buildItem, paginate, pickRelated, sortItems, toDetail } from './packageCatalogue.js';

// PUBLIC read service. Express controllers AND the SSR renderer call these functions directly
// (no internal HTTP). The only way a package becomes visible is Package.publishedVersionId pointing at a
// PackageVersion whose status is 'published'; draft versions are never read here.

const PACKAGE_FIELDS = 'slug code isDemo publishedVersionId';
const VERSION_FIELDS = 'packageId content seasons publishedAt';

async function loadPublishedItems() {
  const packages = await Package.find({ publishedVersionId: { $ne: null } }).select(PACKAGE_FIELDS).lean();
  if (!packages.length) return [];
  const versions = await PackageVersion.find({ _id: { $in: packages.map((p) => p.publishedVersionId) }, status: 'published' })
    .select(VERSION_FIELDS)
    .lean();
  const byId = new Map(versions.map((v) => [String(v._id), v]));
  return packages.flatMap((p) => {
    const version = byId.get(String(p.publishedVersionId));
    return version ? [buildItem(p, version)] : [];
  });
}

export async function listPublishedPackages(query) {
  const items = await loadPublishedItems();
  const sorted = sortItems(applyFilters(items, query), query.sort);
  const { slice, meta } = paginate(sorted, query.page, query.limit);
  return { items: slice.map((i) => i.card), meta };
}

export async function getPackageFilters() {
  return buildFacets(await loadPublishedItems());
}

export async function getPublishedPackageBySlug(slug) {
  if (typeof slug !== 'string' || slug.length > 160 || !SLUG_REGEX.test(slug)) throw ApiError.notFound('Package not found');
  const pkg = await Package.findOne({ slug, publishedVersionId: { $ne: null } }).select(PACKAGE_FIELDS).lean();
  if (!pkg) throw ApiError.notFound('Package not found');
  const version = await PackageVersion.findOne({ _id: pkg.publishedVersionId, status: 'published' }).select(VERSION_FIELDS).lean();
  if (!version) throw ApiError.notFound('Package not found');

  const item = buildItem(pkg, version);
  const related = pickRelated(item, await loadPublishedItems(), 3);
  return toDetail(item, related);
}

/** Cards for the given package ids, restricted to published packages (used by stories). Order is preserved. */
export async function findPublishedCardsByIds(ids = []) {
  const wanted = ids.map(String);
  if (!wanted.length) return [];
  const byId = new Map((await loadPublishedItems()).map((i) => [i.card.id, i.card]));
  return wanted.flatMap((id) => (byId.has(id) ? [byId.get(id)] : []));
}

/** Slugs of all published packages with their last publish time (used for the sitemap). */
export async function listPublishedSlugs() {
  const items = await loadPublishedItems();
  return items.map((i) => ({ slug: i.card.slug, lastModified: i.publishedAt }));
}
