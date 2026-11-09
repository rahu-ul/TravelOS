import { Enquiry } from './enquiry.model.js';
import { Message } from './message.model.js';
import { Package } from '../packages/package.model.js';
import { activityService } from '../activity/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

/**
 * List enquiries with status filtering, assignee filtering, text search, and SLA overdue indicator.
 */
export async function listAdminEnquiries(query = {}) {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo === 'unassigned' ? null : query.assignedTo;
  }
  if (query.q) {
    const q = String(query.q).trim();
    filter.$or = [
      { reference: new RegExp(q, 'i') },
      { 'customer.name': new RegExp(q, 'i') },
      { 'customer.email': new RegExp(q, 'i') },
      { destination: new RegExp(q, 'i') },
    ];
  }

  const enquiries = await Enquiry.find(filter)
    .populate('assignedTo', 'name email')
    .populate('packageId', 'code listing slug')
    .sort({ createdAt: -1 })
    .lean();

  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  return enquiries.map((e) => {
    const isUnanswered = e.status === 'new' && !e.firstResponseAt;
    const ageMs = now - new Date(e.createdAt).getTime();
    const isOverdue = isUnanswered && ageMs > ONE_HOUR_MS;

    return {
      id: String(e._id),
      reference: e.reference,
      customer: e.customer,
      destination: e.destination,
      packageName: e.packageId?.listing?.name || null,
      packageCode: e.packageId?.code || null,
      adults: e.adults,
      children: e.children,
      travelStart: e.travelStart,
      status: e.status,
      assignedTo: e.assignedTo ? { id: String(e.assignedTo._id), name: e.assignedTo.name } : null,
      isOverdue,
      notesCount: e.notes?.length || 0,
      hasAiExtraction: Boolean(e.extracted?.ai),
      aiStatus: e.ai?.status || {},
      createdAt: e.createdAt,
    };
  });
}

/**
 * Get full enquiry details including AI recommendations, staff notes, and package info
 */
export async function getAdminEnquiryById(enquiryId) {
  const enquiry = await Enquiry.findById(enquiryId)
    .populate('assignedTo', 'name email role')
    .populate('packageId', 'code slug listing')
    .populate('notes.authorId', 'name')
    .lean();

  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  // Populate recommended packages info
  const recs = enquiry.ai?.recommendations || [];
  let detailedRecs = [];
  if (recs.length > 0) {
    const pkgIds = recs.map(r => r.packageId);
    const pkgs = await Package.find({ _id: { $in: pkgIds } }).lean();
    const pkgMap = new Map(pkgs.map(p => [String(p._id), p]));
    detailedRecs = recs.map(r => {
      const p = pkgMap.get(String(r.packageId));
      return {
        packageId: r.packageId,
        versionId: r.versionId,
        code: p?.code,
        slug: p?.slug,
        name: p?.listing?.name || 'Package',
        startingPrice: p?.listing?.startingPrice || null,
        reason: r.reason,
      };
    });
  }

  // Fetch messages (sent replies / acknowledgement)
  const messages = await Message.find({ enquiryId: enquiry._id }).sort({ createdAt: 1 }).lean();

  return {
    ...enquiry,
    aiRecommendationsDetailed: detailedRecs,
    messages,
  };
}

/**
 * Assign enquiry to a consultant
 */
export async function assignEnquiry(enquiryId, assigneeId, user) {
  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  enquiry.assignedTo = assigneeId || null;
  await enquiry.save();

  await activityService.log({
    actorId: user._id,
    action: 'enquiry.assigned',
    entityType: 'enquiry',
    entityId: enquiry._id,
    metadata: { assignedTo: assigneeId },
  });

  return enquiry;
}

/**
 * Update enquiry status (new, contacted, quoted, won, lost)
 */
export async function updateEnquiryStatus(enquiryId, status, user) {
  const valid = ['new', 'contacted', 'quoted', 'won', 'lost'];
  if (!valid.includes(status)) throw ApiError.badRequest('Invalid enquiry status');

  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  enquiry.status = status;
  enquiry.statusChangedAt = new Date();
  await enquiry.save();

  await activityService.log({
    actorId: user._id,
    action: 'enquiry.status_changed',
    entityType: 'enquiry',
    entityId: enquiry._id,
    metadata: { status },
  });

  return enquiry;
}

/**
 * Save staff-corrected extraction values
 */
export async function updateStaffExtraction(enquiryId, correctedValues, user) {
  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  enquiry.extracted = enquiry.extracted || {};
  enquiry.extracted.staffCorrected = {
    ...enquiry.extracted.staffCorrected,
    ...correctedValues,
  };
  enquiry.extracted.reviewedBy = user._id;
  enquiry.extracted.reviewedAt = new Date();
  await enquiry.save();

  return enquiry;
}

/**
 * Add internal consultant note
 */
export async function addEnquiryNote(enquiryId, body, user) {
  if (!body || !body.trim()) throw ApiError.badRequest('Note body cannot be empty');

  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  enquiry.notes.push({
    authorId: user._id,
    body: body.trim(),
  });
  await enquiry.save();

  await activityService.log({
    actorId: user._id,
    action: 'enquiry.note_added',
    entityType: 'enquiry',
    entityId: enquiry._id,
  });

  return enquiry;
}

/**
 * Approve reply and record delivery (mocked/sent)
 */
export async function approveAndSendReply(enquiryId, replyBody, user) {
  if (!replyBody || !replyBody.trim()) throw ApiError.badRequest('Reply body cannot be empty');

  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  const message = await Message.create({
    enquiryId: enquiry._id,
    type: 'reply',
    to: enquiry.customer.email,
    subject: `Your TravelOS Kerala Itinerary Enquiry [${enquiry.reference}]`,
    body: replyBody.trim(),
    approvedBy: user._id,
    approvedAt: new Date(),
    aiAssisted: true,
    deliveryStatus: 'mocked', // Explicitly marked as mocked delivery in development
  });

  if (!enquiry.firstResponseAt) {
    enquiry.firstResponseAt = new Date();
  }
  if (enquiry.status === 'new') {
    enquiry.status = 'contacted';
    enquiry.statusChangedAt = new Date();
  }
  await enquiry.save();

  await activityService.log({
    actorId: user._id,
    action: 'enquiry.reply_approved',
    entityType: 'enquiry',
    entityId: enquiry._id,
    metadata: { messageId: message._id },
  });

  return { enquiry, message };
}

