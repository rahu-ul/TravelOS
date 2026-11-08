import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { createEnquirySchema } from './enquiries.validation.js';
import { createPublicEnquiry } from './enquiries.service.js';

// Public submission endpoint, mounted at /api/enquiries. Staff-side enquiry management arrives in Phase 4.
export function createEnquiryRouter({ limit = 10, windowMs = 60 * 60 * 1000 } = {}) {
  const router = Router();
  const limiter = createLimiter({
    windowMs,
    limit,
    message: 'You have sent several enquiries recently. Please wait a while or contact us directly.',
  });

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
