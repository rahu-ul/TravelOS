import { Enquiry } from './enquiry.model.js';
import { Package } from '../packages/package.model.js';
import { activityService } from '../activity/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

// The Enquiry model requires a free-text `message`. The website form has "special requirements" instead,
// so when that is missing/too short we describe the structured fields the visitor actually entered.
function buildMessage(input, packageName) {
  if (input.requirements && input.requirements.length >= 5) return input.requirements;
  const party = `${input.adults} adult${input.adults === 1 ? '' : 's'}${input.children ? ` and ${input.children} child${input.children === 1 ? '' : 'ren'}` : ''}`;
  const target = packageName ? ` for "${packageName}"` : input.destination ? ` for ${input.destination}` : '';
  return `Website enquiry${target}: ${party}.`;
}

/**
 * Persist a public enquiry. The enquiry is saved FIRST; nothing after the save (audit log, and in Phase 5 the AI
 * pipeline) can make the submission fail. Returns only what the visitor needs: the reference number.
 */
export async function createPublicEnquiry(input) {
  let packageId = null;
  let packageName = null;
  if (input.packageSlug) {
    const pkg = await Package.findOne({ slug: input.packageSlug, publishedVersionId: { $ne: null } }).select('_id listing.name').lean();
    if (!pkg) throw ApiError.unprocessable('The selected package is not available', [{ path: 'packageSlug', message: 'This package is not available' }]);
    packageId = pkg._id;
    packageName = pkg.listing?.name ?? null;
  }

  const message = buildMessage(input, packageName);

  // Server-side duplicate guard (double click, retry after a slow response): same email + same message recently.
  const duplicate = await Enquiry.findOne({
    'customer.email': input.email.toLowerCase(),
    message,
    packageId,
    createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
  })
    .select('reference createdAt')
    .lean();
  if (duplicate) return { reference: duplicate.reference, createdAt: duplicate.createdAt, duplicate: true };

  const enquiry = await Enquiry.create({
    customer: { name: input.name, email: input.email, phone: input.phone },
    packageId,
    destination: input.destination,
    travelStart: input.travelStart,
    travelEnd: input.travelEnd,
    adults: input.adults,
    children: input.children ?? 0,
    budget: input.budget !== undefined ? { amount: input.budget } : undefined,
    requirements: input.requirements,
    message,
    whatsappConsent: input.whatsappConsent ?? false,
    source: 'website',
  });

  try {
    await activityService.log({ actorId: null, action: 'enquiry.created', entityType: 'enquiry', entityId: enquiry._id, metadata: { source: 'website' } });
  } catch (err) {
    logger.warn('Enquiry saved but activity log failed:', err.message);
  }

  // Trigger AI assistant processing asynchronously. Failure is caught and logged inside the function.
  import('./ai.service.js').then(({ processEnquiryWithAi }) => {
    processEnquiryWithAi(enquiry._id).catch((err) => {
      logger.warn('Async AI processing failed:', err.message);
    });
  }).catch(() => {});

  return { reference: enquiry.reference, createdAt: enquiry.createdAt, duplicate: false };
}
