import { Story } from './story.model.js';
import { activityService } from '../activity/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { SLUG_REGEX, STORY_STATUSES } from '../../config/constants.js';

export async function listAdminStories() {
  const stories = await Story.find()
    .populate('author', 'name email role')
    .populate('relatedPackageIds', 'slug code')
    .sort({ updatedAt: -1 })
    .lean();
  return stories;
}

export async function getAdminStoryById(id) {
  const story = await Story.findById(id)
    .populate('author', 'name email role')
    .populate('relatedPackageIds', 'slug code')
    .lean();
  if (!story) throw ApiError.notFound('Story not found');
  return story;
}

export async function createStory(data = {}, user) {
  const { title, slug: customSlug, excerpt, body, coverImage, tags, status = 'draft', relatedPackageIds, seo } = data;
  if (!title || !title.trim()) throw ApiError.badRequest('Story title is required');
  if (!body || !body.trim()) throw ApiError.badRequest('Story body is required');

  let slug = (customSlug || title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  if (!SLUG_REGEX.test(slug)) {
    throw ApiError.badRequest('Generated slug is invalid. Provide a valid slug with letters, numbers, and hyphens.');
  }

  const existing = await Story.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const story = await Story.create({
    title: title.trim(),
    slug,
    excerpt: excerpt?.trim() || '',
    body: body.trim(),
    coverImage: coverImage?.url ? { url: coverImage.url, alt: coverImage.alt || title.trim() } : undefined,
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
    status: STORY_STATUSES.includes(status) ? status : 'draft',
    author: user._id,
    publishedAt: status === 'published' ? new Date() : undefined,
    relatedPackageIds: Array.isArray(relatedPackageIds) ? relatedPackageIds : [],
    seo: seo || { title: title.trim(), description: excerpt?.trim() || '' },
  });

  await activityService.log({
    actorId: user._id,
    action: 'story.created',
    entityType: 'story',
    entityId: story._id,
    metadata: { title: story.title, slug: story.slug, status: story.status },
  });

  return story;
}

export async function updateStory(id, data = {}, user) {
  const story = await Story.findById(id);
  if (!story) throw ApiError.notFound('Story not found');

  const { title, excerpt, body, coverImage, tags, status, relatedPackageIds, seo } = data;

  if (title) story.title = title.trim();
  if (excerpt !== undefined) story.excerpt = excerpt.trim();
  if (body) story.body = body.trim();
  if (coverImage) {
    story.coverImage = coverImage.url ? { url: coverImage.url, alt: coverImage.alt || story.title } : undefined;
  }
  if (Array.isArray(tags)) {
    story.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }
  if (status && STORY_STATUSES.includes(status)) {
    story.status = status;
    if (status === 'published' && !story.publishedAt) {
      story.publishedAt = new Date();
    }
  }
  if (Array.isArray(relatedPackageIds)) {
    story.relatedPackageIds = relatedPackageIds;
  }
  if (seo) {
    story.seo = seo;
  }

  await story.save();

  await activityService.log({
    actorId: user._id,
    action: 'story.updated',
    entityType: 'story',
    entityId: story._id,
    metadata: { title: story.title, status: story.status },
  });

  return story;
}

export async function togglePublishStory(id, user) {
  const story = await Story.findById(id);
  if (!story) throw ApiError.notFound('Story not found');

  const newStatus = story.status === 'published' ? 'draft' : 'published';
  story.status = newStatus;
  if (newStatus === 'published' && !story.publishedAt) {
    story.publishedAt = new Date();
  }
  await story.save();

  await activityService.log({
    actorId: user._id,
    action: 'story.published',
    entityType: 'story',
    entityId: story._id,
    metadata: { title: story.title, status: story.status },
  });

  return story;
}

export async function deleteStory(id, user) {
  const story = await Story.findByIdAndDelete(id);
  if (!story) throw ApiError.notFound('Story not found');
  return { deleted: true, id };
}

