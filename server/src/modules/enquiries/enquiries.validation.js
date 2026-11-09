import { z } from 'zod';
import { EMAIL_REGEX, SLUG_REGEX } from '../../config/constants.js';

// Same pattern as the Enquiry model so API and database agree.
export const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

const blankToUndefined = (v) => (v === '' || v === null ? undefined : v);
const optionalText = (max) => z.preprocess(blankToUndefined, z.string().trim().max(max, `Maximum ${max} characters`).optional());
const optionalDate = z.preprocess(blankToUndefined, z.coerce.date({ error: 'Enter a valid date' }).optional());
const optionalInt = (min, max, label) =>
  z.preprocess(blankToUndefined, z.coerce.number({ error: `${label} must be a number` }).int(`${label} must be a whole number`).min(min, `${label} cannot be below ${min}`).max(max, `${label} cannot be above ${max}`).optional());

// Unknown keys are stripped, so a client can never set status, assignedTo, source, AI fields, etc.
export const createEnquirySchema = z
  .object({
    name: z.string({ error: 'Name is required' }).trim().min(2, 'Enter your full name').max(120, 'Name is too long'),
    email: z.string({ error: 'Email is required' }).trim().max(254, 'Email is too long').regex(EMAIL_REGEX, 'Enter a valid email address'),
    phone: z.string({ error: 'Phone number is required' }).trim().regex(PHONE_REGEX, 'Enter a valid phone number (7-20 digits, optional +)'),
    destination: optionalText(120),
    packageSlug: z.preprocess(blankToUndefined, z.string().trim().max(160).regex(SLUG_REGEX, 'Invalid package').optional()),
    travelStart: optionalDate,
    travelEnd: optionalDate,
    adults: z.coerce.number({ error: 'Enter the number of adults' }).int('Adults must be a whole number').min(1, 'At least one adult is required').max(50, 'Adults cannot be above 50'),
    children: optionalInt(0, 50, 'Children'),
    budget: optionalInt(0, 100_000_000, 'Budget'),
    requirements: optionalText(2000),
    whatsappConsent: z.boolean({ error: 'Invalid consent value' }).optional(),
  })
  .superRefine((v, ctx) => {
    // Small tolerance so "today" in any timezone is accepted.
    const earliest = Date.now() - 24 * 60 * 60 * 1000;
    if (v.travelStart && v.travelStart.getTime() < earliest) {
      ctx.addIssue({ code: 'custom', path: ['travelStart'], message: 'Travel start date cannot be in the past' });
    }
    if (v.travelStart && v.travelEnd && v.travelEnd < v.travelStart) {
      ctx.addIssue({ code: 'custom', path: ['travelEnd'], message: 'End date must be on or after the start date' });
    }
  });
