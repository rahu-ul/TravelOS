import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS, ROLES } from '../../config/constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { User } from './user.model.js';
import * as packageCms from '../packages/packageCms.service.js';
import * as enquiryAdmin from '../enquiries/enquiriesAdmin.service.js';

export const adminRouter = Router();
adminRouter.use(authenticate);

// ─── Staff Users (Assignees) ──────────────────────────────────────────────────
adminRouter.get(
  '/users',
  authorize(PERMISSIONS.USERS_READ),
  asyncHandler(async (_req, res) => {
    const users = await User.find({ role: ROLES.STAFF_ADMIN, isActive: true }).select('name email role').sort({ name: 1 });
    sendSuccess(res, { users }, { meta: { count: users.length } });
  })
);

// ─── Package CMS ─────────────────────────────────────────────────────────────
const pkgRouter = Router();
pkgRouter.use(authorize(PERMISSIONS.PACKAGES_READ));

pkgRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const packages = await packageCms.listAdminPackages();
    sendSuccess(res, { packages });
  })
);

pkgRouter.post(
  '/',
  authorize(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    const result = await packageCms.createPackage(req.body, req.user);
    sendSuccess(res, result, { status: 201 });
  })
);

pkgRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await packageCms.getAdminPackageById(req.params.id);
    sendSuccess(res, result);
  })
);

pkgRouter.put(
  '/:id/draft',
  authorize(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    const draft = await packageCms.updateDraft(req.params.id, req.body, req.user);
    sendSuccess(res, { draft });
  })
);

pkgRouter.post(
  '/:id/publish',
  authorize(PERMISSIONS.PACKAGES_PUBLISH),
  asyncHandler(async (req, res) => {
    const result = await packageCms.publishPackage(req.params.id, req.user, req.body?.changeNote);
    sendSuccess(res, result);
  })
);

pkgRouter.post(
  '/:id/duplicate',
  authorize(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    const result = await packageCms.duplicatePackage(req.params.id, req.user);
    sendSuccess(res, result, { status: 201 });
  })
);

pkgRouter.post(
  '/:id/restore/:versionId',
  authorize(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    const draft = await packageCms.restoreVersion(req.params.id, req.params.versionId, req.user);
    sendSuccess(res, { draft });
  })
);

pkgRouter.get(
  '/:id/preview',
  asyncHandler(async (req, res) => {
    const preview = await packageCms.previewDraft(req.params.id);
    sendSuccess(res, { package: preview });
  })
);

adminRouter.use('/packages', pkgRouter);

// ─── Enquiry Management & Inbox ──────────────────────────────────────────────
const enqRouter = Router();
enqRouter.use(authorize(PERMISSIONS.ENQUIRIES_READ));

enqRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const enquiries = await enquiryAdmin.listAdminEnquiries(req.query);
    sendSuccess(res, { enquiries });
  })
);

enqRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const enquiry = await enquiryAdmin.getAdminEnquiryById(req.params.id);
    sendSuccess(res, { enquiry });
  })
);

enqRouter.patch(
  '/:id/assign',
  authorize(PERMISSIONS.ENQUIRIES_WRITE),
  asyncHandler(async (req, res) => {
    const enquiry = await enquiryAdmin.assignEnquiry(req.params.id, req.body.assignedTo, req.user);
    sendSuccess(res, { enquiry });
  })
);

enqRouter.patch(
  '/:id/status',
  authorize(PERMISSIONS.ENQUIRIES_WRITE),
  asyncHandler(async (req, res) => {
    const enquiry = await enquiryAdmin.updateEnquiryStatus(req.params.id, req.body.status, req.user);
    sendSuccess(res, { enquiry });
  })
);

enqRouter.patch(
  '/:id/extracted',
  authorize(PERMISSIONS.ENQUIRIES_WRITE),
  asyncHandler(async (req, res) => {
    const enquiry = await enquiryAdmin.updateStaffExtraction(req.params.id, req.body.extracted, req.user);
    sendSuccess(res, { enquiry });
  })
);

enqRouter.post(
  '/:id/notes',
  authorize(PERMISSIONS.ENQUIRIES_WRITE),
  asyncHandler(async (req, res) => {
    const enquiry = await enquiryAdmin.addEnquiryNote(req.params.id, req.body.body, req.user);
    sendSuccess(res, { enquiry });
  })
);

enqRouter.post(
  '/:id/reply',
  authorize(PERMISSIONS.ENQUIRIES_WRITE),
  asyncHandler(async (req, res) => {
    const result = await enquiryAdmin.approveAndSendReply(req.params.id, req.body.body, req.user);
    sendSuccess(res, result);
  })
);

adminRouter.use('/enquiries', enqRouter);
