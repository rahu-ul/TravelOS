import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { createEnquirySchema } from './enquiries.validation.js';
import { createPublicEnquiry } from './enquiries.service.js';
import { Enquiry } from './enquiry.model.js';

// Public submission endpoint, mounted at /api/enquiries. Staff-side enquiry management arrives in Phase 4.
export function createEnquiryRouter({ limit = 10, windowMs = 60 * 60 * 1000 } = {}) {
  const router = Router();
  const limiter = createLimiter({
    windowMs,
    limit,
    message: 'You have sent several enquiries recently. Please wait a while or contact us directly.',
  });

  // Authenticated traveller's personal enquiries
  router.get(
    '/my',
    authenticate,
    asyncHandler(async (req, res) => {
      // Find enquiries matching traveller's email
      const enquiries = await Enquiry.find({ 'customer.email': req.user.email })
        .populate('packageId', 'code listing slug')
        .sort({ createdAt: -1 })
        .lean();

      const items = enquiries.map((e) => ({
        id: String(e._id),
        reference: e.reference,
        packageName: e.packageId?.listing?.name || null,
        packageCode: e.packageId?.code || null,
        destination: e.destination,
        travelStart: e.travelStart,
        travelEnd: e.travelEnd,
        adults: e.adults,
        children: e.children,
        status: e.status,
        message: e.message,
        createdAt: e.createdAt,
      }));

      sendSuccess(res, { enquiries: items });
    })
  );

  router.post(
    '/',
    limiter,
    validate({ body: createEnquirySchema }),
    asyncHandler(async (req, res) => {
      const result = await createPublicEnquiry(req.body);
      sendSuccess(res, { reference: result.reference, receivedAt: result.createdAt, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
    })
  );
  return router;
}
