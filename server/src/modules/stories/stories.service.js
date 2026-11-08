import { Story } from './story.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { SLUG_REGEX } from '../../config/constants.js';
import { findPublishedCardsByIds } from '../packages/packages.service.js';

// PUBLIC read service for travel stories. Only status === 'published' is ever returned.
// Called directly by controllers and by the SSR renderer.

const PUBLISHED = { status: 'published' };
const CARD_FIELDS = 'slug title excerpt body coverImage tags publishedAt isDemo';

const readingMinutes = (body = '') => Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200));
const iso = (d) => (d ? new Date(d).toISOString() : null);

function toCard(s) {
  return {
    id: String(s._id),
    slug: s.slug,
    title: s.title,
    excerpt: s.excerpt ?? null,
    coverImage: s.coverImage?.url ? { url: s.coverImage.url, alt: s.coverImage.alt || s.title } : null,
    tags: s.tags ?? [],
    publishedAt: iso(s.publishedAt),
    readingMinutes: readingMinutes(s.body),
    isDemo: Boolean(s.isDemo),
  };
}

export async function listPublishedStories({ page = 1, limit = 9, tag } = {}) {
  const filter = { ...PUBLISHED, ...(tag ? { tags: String(tag).toLowerCase() } : {}) };
  const [total, docs] = await Promise.all([
    Story.countDocuments(filter),
    Story.find(filter).sort({ publishedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select(CARD_FIELDS).lean(),
  ]);
  return { items: docs.map(toCard), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getPublishedStoryBySlug(slug) {
  if (typeof slug !== 'string' || slug.length > 160 || !SLUG_REGEX.test(slug)) throw ApiError.notFound('Story not found');
  const story = await Story.findOne({ slug, ...PUBLISHED }).populate('author', 'name').lean();
  if (!story) throw ApiError.notFound('Story not found');

  const [relatedPackages, moreStories] = await Promise.all([
    findPublishedCardsByIds(story.relatedPackageIds ?? []),
    Story.find({ ...PUBLISHED, _id: { $ne: story._id } }).sort({ publishedAt: -1 }).limit(3).select(CARD_FIELDS).lean(),
  ]);

  return {
    ...toCard(story),
    body: story.body,
    author: story.author?.name ? { name: story.author.name } : null,
    seo: { title: story.seo?.title || story.title, description: story.seo?.description || story.excerpt || null },
    relatedPackages,
    moreStories: moreStories.map(toCard),
  };
}

/** Slugs of all published stories (used for the sitemap). */
export async function listPublishedStorySlugs() {
  const docs = await Story.find(PUBLISHED).select('slug updatedAt publishedAt').lean();
  return docs.map((s) => ({ slug: s.slug, lastModified: s.updatedAt ?? s.publishedAt ?? null }));
}
