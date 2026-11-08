import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ENQUIRY_STATUSES, ENQUIRY_SOURCES, AI_TASK_STATUSES, EMAIL_REGEX } from '../../config/constants.js';

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Structured requirements. Every field is nullable: unknown stays null, it is never guessed.
const requirementsSchema = new Schema(
  {
    adults: { type: Number, min: 0, max: 50, default: null },
    children: { type: Number, min: 0, max: 50, default: null },
    destination: { type: String, trim: true, maxlength: 120, default: null },
    nightsMin: { type: Number, min: 0, max: 60, default: null },
    nightsMax: { type: Number, min: 0, max: 60, default: null },
    travelPeriod: { type: String, trim: true, maxlength: 120, default: null },
    budgetInr: { type: Number, min: 0, default: null },
    mustHaves: [{ type: String, trim: true, maxlength: 120 }],
  },
  { _id: false }
);

const taskStatus = { type: String, enum: AI_TASK_STATUSES, default: 'pending' };

const enquirySchema = new Schema(
  {
    reference: { type: String, unique: true, immutable: true },
    customer: {
      name: { type: String, required: [true, 'Customer name is required'], trim: true, minlength: 2, maxlength: 120 },
      email: { type: String, required: [true, 'Customer email is required'], trim: true, lowercase: true, maxlength: 254, match: [EMAIL_REGEX, 'Email is not valid'] },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
        match: [/^\+?[\d\s\-()]{7,20}$/, 'Phone number is not valid'],
      },
    },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', default: null },
    destination: { type: String, trim: true, maxlength: 120 },
    travelStart: Date,
    travelEnd: Date,
    adults: { type: Number, required: [true, 'Number of adults is required'], min: [1, 'At least one adult is required'], max: 50, validate: { validator: Number.isInteger, message: 'Adults must be a whole number' } },
    children: { type: Number, default: 0, min: 0, max: 50, validate: { validator: Number.isInteger, message: 'Children must be a whole number' } },
    budget: {
      amount: { type: Number, min: 0 },
      currency: { type: String, enum: ['INR'], default: 'INR' },
    },
    requirements: { type: String, trim: true, maxlength: 2000 },
    message: { type: String, required: [true, 'Message is required'], trim: true, minlength: 5, maxlength: 5000 },
    whatsappConsent: { type: Boolean, default: false },
    source: { type: String, enum: ENQUIRY_SOURCES, default: 'website' },

    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
    statusChangedAt: Date,
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    firstResponseAt: Date, // used for response-time tracking
    notes: [noteSchema],

    // AI output is stored as suggestions only; staff-corrected values live alongside it.
    extracted: {
      ai: { type: requirementsSchema, default: undefined },
      staffCorrected: { type: requirementsSchema, default: undefined },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
    },
    ai: {
      status: { extract: taskStatus, recommend: taskStatus, draft: taskStatus },
      recommendations: [
        new Schema(
          {
            packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
            versionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion', required: true },
            reason: { type: String, maxlength: 600 },
          },
          { _id: false }
        ),
      ],
      replyDraft: { type: String, maxlength: 6000 },
      lastRunAt: Date,
      lastError: { type: String, maxlength: 300 },
    },
  },
  { timestamps: true }
);

enquirySchema.pre('validate', function setDefaults(next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    this.reference = `ENQ-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
  if (this.travelStart && this.travelEnd && this.travelEnd < this.travelStart) {
    this.invalidate('travelEnd', 'Travel end date must be on or after the start date');
  }
  next();
});

enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ assignedTo: 1, status: 1 });
enquirySchema.index({ packageId: 1 });
enquirySchema.index({ 'customer.name': 'text', 'customer.email': 'text', message: 'text', reference: 'text' });

export const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
